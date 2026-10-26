import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'

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
