import { Job } from 'bull'
import { getStripe } from '@/lib/stripe'
import {
  getCheckoutQueue,
  CheckoutJobData,
  CheckoutJobResult,
  getRedisClient,
} from '@/lib/checkout-queue'
import { createServerClient } from '@/lib/supabase'

interface TransactionLog {
  jobId: string
  userId: string
  timestamp: string
  status: 'started' | 'processing' | 'completed' | 'failed'
  stripeSessionId?: string
  error?: string
  durationMs?: number
}

const transactionLogs: TransactionLog[] = []

async function logTransaction(log: TransactionLog): Promise<void> {
  transactionLogs.push(log)

  // Optional: persist to DB
  try {
    const supabase = createServerClient()
    await supabase.from('checkout_logs').insert({
      job_id: log.jobId,
      user_id: log.userId,
      status: log.status,
      stripe_session_id: log.stripeSessionId,
      error: log.error,
      duration_ms: log.durationMs,
      created_at: log.timestamp,
    })
  } catch (err) {
    console.error('[checkout-worker] Failed to log to DB:', err)
  }
}

async function processCheckoutJob(job: Job<CheckoutJobData>): Promise<CheckoutJobResult> {
  const { userId, email, plan, priceId, origin } = job.data
  const startTime = Date.now()
  const jobId = job.id as string

  try {
    // Log job start
    await logTransaction({
      jobId,
      userId,
      timestamp: new Date().toISOString(),
      status: 'started',
    })

    // Progress: 20%
    await job.progress(20)

    const stripe = getStripe()

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      customer_email: email,
      metadata: { user_id: userId, plan, job_id: jobId },
      subscription_data: { metadata: { user_id: userId } },
      success_url: `${origin}/dashboard?upgrade=success&plan=${plan}&job_id=${jobId}`,
      cancel_url: `${origin}/planos`,
      locale: 'pt-BR',
    })

    // Progress: 80%
    await job.progress(80)

    // Log transaction success to DB
    const durationMs = Date.now() - startTime
    await logTransaction({
      jobId,
      userId,
      timestamp: new Date().toISOString(),
      status: 'completed',
      stripeSessionId: session.id,
      durationMs,
    })

    // Progress: 100%
    await job.progress(100)

    // Cache result in Redis
    const redis = getRedisClient()
    const result: CheckoutJobResult = {
      jobId,
      sessionUrl: session.url,
      stripeSessionId: session.id,
      status: 'completed',
      timestamp: new Date().toISOString(),
      retries: job.attemptsMade,
      maxRetries: job.opts.attempts || 3,
    }

    await redis.setex(`checkout:result:${jobId}`, 3600, JSON.stringify(result))

    return result
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : String(error)

    // Log transaction failure
    await logTransaction({
      jobId,
      userId,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: errorMsg,
      durationMs,
    })

    console.error(`[checkout-worker] Job ${jobId} processing failed:`, error)

    // Rethrow to trigger Bull's retry mechanism
    throw new Error(`Checkout job failed: ${errorMsg}`)
  }
}

export async function startCheckoutWorker(): Promise<void> {
  const queue = getCheckoutQueue()

  // Process jobs with concurrency of 5
  queue.process(5, async (job) => {
    return processCheckoutJob(job)
  })

  queue.on('completed', (job) => {
    console.log(`[checkout-worker] Job ${job.id} completed successfully`)
  })

  queue.on('failed', (job, err) => {
    console.error(`[checkout-worker] Job ${job.id} failed after retries:`, err)
  })

  console.log('[checkout-worker] Checkout worker started (concurrency: 5)')
}

export function getTransactionLogs(): TransactionLog[] {
  return [...transactionLogs]
}

export function clearTransactionLogs(): void {
  transactionLogs.length = 0
}
