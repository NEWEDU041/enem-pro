import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'
import { getCached, setCached } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/portal',
      error: 'Authentication failed',
    })
    return auth.response
  }
  const { userId } = auth
  logContext.userId = userId

  const supabase = createServerClient()

  // USER-BASED RATE LIMITING
  const rl = await checkUserRateLimit(userId, supabase, '/api/portal')
  if (!rl.ok) {
    logError(logger, logContext, {
      status: 429,
      endpoint: '/api/portal',
      error: 'Rate limit exceeded',
      metadata: { 
        tier: rl.tier,
        remaining: rl.remaining,
        retryAfterSeconds: rl.retryAfterSeconds,
      },
    })
    const headers: Record<string, string> = rl.headers || {}
    return NextResponse.json(
      { 
        error: 'Limite de requisições atingido',
        tier: rl.tier,
        reset_at: rl.resetAt.toISOString(),
      },
      { status: 429, headers }
    )
  }

  const stripe = getStripe()
  if (!stripe) {
    logError(logger, logContext, {
      status: 503,
      endpoint: '/api/portal',
      error: 'Stripe not configured',
    })
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })
  }
  
  const supabase = createServerClient()
  
  // L1 CACHE — Try Redis first for customer ID
  const cachedCustomerId = await getCached<{ stripe_customer_id: string }>('stripe_customer', userId)
  if (cachedCustomerId?.stripe_customer_id) {
    const stripe = getStripe()
    if (stripe) {
      try {
        const origin = cleanEnv(request.headers.get('origin') ?? undefined)
          || cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
          || 'https://questoesenem.pro'

        const session = await stripe.billingPortal.sessions.create({
          customer: cachedCustomerId.stripe_customer_id,
          return_url: `${origin}/dashboard`,
        })

        logSuccess(logger, logContext, {
          status: 200,
          endpoint: '/api/portal',
          message: 'Billing portal session created',
          metadata: { customerId: cachedCustomerId.stripe_customer_id, cached: true },
        })

        return NextResponse.json({ url: session.url })
      } catch (e) {
        // Fall through to DB lookup if session creation fails
        logError(logger, logContext, {
          status: 500,
          endpoint: '/api/portal',
          error: 'Failed to create portal session from cached customer',
        })
      }
    }
  }

  // L2 CACHE — Supabase DB
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    logError(logger, logContext, {
      status: 404,
      endpoint: '/api/portal',
      error: 'No active Stripe subscription',
    })
    return NextResponse.json({ error: 'Sem assinatura Stripe ativa' }, { status: 404 })
  }

  // Promote to Redis cache (async, non-blocking)
  setCached('stripe_customer', userId, { stripe_customer_id: sub.stripe_customer_id }).catch(e => {
    console.error('[portal] redis cache set failed:', String(e))
  })

  const origin = cleanEnv(request.headers.get('origin') ?? undefined)
    || cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
    || 'https://questoesenem.pro'

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/dashboard`,
  })

  logSuccess(logger, logContext, {
    status: 200,
    endpoint: '/api/portal',
    message: 'Billing portal session created',
    metadata: { customerId: sub.stripe_customer_id },
  })

  return NextResponse.json({ url: session.url })
})
