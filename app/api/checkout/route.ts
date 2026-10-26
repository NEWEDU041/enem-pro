import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'
import { CheckoutRequestSchema, validateRequestBody, formatValidationError } from '@/lib/validation'
import { getCached, setCached } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)
  
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

  const stripe = getStripe()
  logContext.userId = userId
  logContext.email = email

  const priceId = plan === 'annual' ? annualPriceId : monthlyPriceId

  const origin = cleanEnv(request.headers.get('origin') ?? undefined)
    || cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
    || 'https://questoesenem.pro'

  // Cache price IDs for faster future requests (async, non-blocking)
  setCached('stripe_price', 'monthly', { price_id: monthlyPriceId }).catch(e => {
    console.error('[checkout] redis cache set failed for monthly:', String(e))
  })
  setCached('stripe_price', 'annual', { price_id: annualPriceId }).catch(e => {
    console.error('[checkout] redis cache set failed for annual:', String(e))
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: userId,
    customer_email: email,
    metadata: { user_id: userId, plan },
    subscription_data: { metadata: { user_id: userId } },
    success_url: `${origin}/dashboard?upgrade=success&plan=${plan}`,
    cancel_url: `${origin}/planos`,
    locale: 'pt-BR',
  })

  logSuccess(logger, logContext, {
    status: 200,
    endpoint: '/api/checkout',
    message: 'Checkout session created',
    metadata: { plan, sessionId: session.id },
  })

  return NextResponse.json({ url: session.url })
})
