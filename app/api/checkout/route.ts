import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'
import { CheckoutRequestSchema, validateRequestBody, formatValidationError } from '@/lib/validation'
import { getCached, setCached } from '@/lib/cache'
import { enqueueCheckout } from '@/lib/checkout-queue'

export const dynamic = 'force-dynamic'

// Price IDs from environment (must be set)
const STRIPE_MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder'
const STRIPE_ANNUAL_PRICE_ID = process.env.STRIPE_ANNUAL_PRICE_ID || 'price_annual_placeholder'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  const startTime = Date.now()
  
  // INPUT VALIDATION
  const validation = await validateRequestBody(request, CheckoutRequestSchema)
  if (!validation.ok) {
    logError(logger, logContext, {
      status: 400,
      endpoint: '/api/checkout',
      error: 'Validation failed',
      metadata: { details: validation.error.details },
    })
    return NextResponse.json(validation.error, { status: 400 })
  }
  const { plan } = validation.data
  
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/checkout',
      error: 'Authentication failed',
    })
    return auth.response
  }
  const { userId, email } = auth
  logContext.userId = userId
  logContext.email = email

  const { createServerClient } = await import('@/lib/supabase')
  const supabase = createServerClient()

  // USER-BASED RATE LIMITING
  const rl = await checkUserRateLimit(userId, supabase, '/api/checkout')
  if (!rl.ok) {
    logError(logger, logContext, {
      status: 429,
      endpoint: '/api/checkout',
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

  const priceId = plan === 'annual' ? STRIPE_ANNUAL_PRICE_ID : STRIPE_MONTHLY_PRICE_ID

  const origin = cleanEnv(request.headers.get('origin') ?? undefined)
    || cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
    || 'https://questoesenem.pro'

  // Cache price IDs for faster future requests (async, non-blocking)
  setCached('stripe_price', 'monthly', { price_id: STRIPE_MONTHLY_PRICE_ID }).catch(e => {
    console.error('[checkout] redis cache set failed for monthly:', String(e))
  })
  setCached('stripe_price', 'annual', { price_id: STRIPE_ANNUAL_PRICE_ID }).catch(e => {
    console.error('[checkout] redis cache set failed for annual:', String(e))
  })

  try {
    // ENQUEUE CHECKOUT JOB (ASYNC)
    // This returns immediately without waiting for Stripe API call
    const { jobId, statusUrl } = await enqueueCheckout({
      userId,
      email,
      plan,
      priceId,
      origin,
    })

    const responseTime = Date.now() - startTime

    logSuccess(logger, logContext, {
      status: 202,
      endpoint: '/api/checkout',
      message: 'Checkout job enqueued for async processing',
      metadata: {
        plan,
        jobId,
        responseTimeMs: responseTime,
      },
    })

    // Return HTTP 202 (Accepted) with job ID and status URL
    // Client can poll /api/checkout/status/:jobId to get the session URL
    return NextResponse.json(
      {
        jobId,
        statusUrl,
        message: 'Checkout job enqueued. Poll statusUrl for completion.',
      },
      { status: 202 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/checkout',
      error: 'Failed to enqueue checkout job',
      metadata: { details: errorMsg },
    })

    return NextResponse.json(
      { error: 'Failed to process checkout request' },
      { status: 500 }
    )
  }
})
