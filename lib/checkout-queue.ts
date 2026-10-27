import Queue, { Job } from 'bull'
import Redis from 'ioredis'

export interface CheckoutJobData {
  userId: string
  email: string
  plan: 'monthly' | 'annual'
  priceId: string
  origin: string
}

export interface CheckoutJobResult {
  jobId: string
  sessionUrl?: string
  error?: string
  status: 'processing' | 'completed' | 'failed'
  stripeSessionId?: string
  timestamp: string
  retries: number
  maxRetries: number
}

let checkoutQueue: Queue.Queue<CheckoutJobData> | null = null
let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }
  return redisClient
}

export function getCheckoutQueue(): Queue.Queue<CheckoutJobData> {
  if (!checkoutQueue) {
    const redis = getRedisClient()
    checkoutQueue = new Queue('checkout', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // 1 hour
        },
        removeOnFail: false,
      },
    })

    checkoutQueue.on('error', (err) => {
      console.error('[checkout-queue] Queue error:', err)
    })

    checkoutQueue.on('failed', (job, err) => {
      console.error(`[checkout-queue] Job ${job.id} failed:`, err)
    })
  }

  return checkoutQueue
}

export async function enqueueCheckout(
  data: CheckoutJobData,
): Promise<{ jobId: string; statusUrl: string }> {
  const queue = getCheckoutQueue()

  const job = await queue.add(data, {
    jobId: `checkout-${data.userId}-${Date.now()}`,
    priority: 10,
  })

  return {
    jobId: job.id as string,
    statusUrl: `/api/checkout/status/${job.id}`,
  }
}

export async function getJobStatus(
  jobId: string,
): Promise<CheckoutJobResult | null> {
  const queue = getCheckoutQueue()
  const redis = getRedisClient()

  // Try to get from queue first
  const job = await queue.getJob(jobId)

  // Check job result cache in Redis
  const cachedResult = await redis.get(`checkout:result:${jobId}`)
  if (cachedResult) {
    return JSON.parse(cachedResult)
  }

  if (!job) {
    return null
  }

  // Map job state to result
  if (job.isCompleted()) {
    const result: CheckoutJobResult = {
      jobId,
      status: 'completed',
      sessionUrl: job.data ? (job.data as any).sessionUrl : undefined,
      stripeSessionId: job.data ? (job.data as any).stripeSessionId : undefined,
      timestamp: new Date().toISOString(),
      retries: job.attemptsMade,
      maxRetries: job.opts.attempts || 3,
    }
    // Cache result for 1 hour
    await redis.setex(`checkout:result:${jobId}`, 3600, JSON.stringify(result))
    return result
  }

  if (job.isFailed()) {
    return {
      jobId,
      status: 'failed',
      error: job.failedReason || 'Unknown error',
      timestamp: new Date().toISOString(),
      retries: job.attemptsMade,
      maxRetries: job.opts.attempts || 3,
    }
  }

  return {
    jobId,
    status: 'processing',
    timestamp: new Date().toISOString(),
    retries: job.attemptsMade,
    maxRetries: job.opts.attempts || 3,
  }
}

export async function closeQueue(): Promise<void> {
  if (checkoutQueue) {
    await checkoutQueue.close()
    checkoutQueue = null
  }
  if (redisClient) {
    redisClient.disconnect()
    redisClient = null
  }
}
