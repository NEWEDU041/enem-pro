import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })

  const monthlyPriceId = cleanEnv(process.env.STRIPE_PRICE_ID_MONTHLY)
  const annualPriceId = cleanEnv(process.env.STRIPE_PRICE_ID_ANNUAL)
  if (!monthlyPriceId || !annualPriceId) {
    return NextResponse.json({ error: 'Preços Stripe não configurados' }, { status: 503 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId, email } = auth

  const body = await request.json()
  const plan = body.plan === 'annual' ? 'annual' : 'monthly'
  const priceId = plan === 'annual' ? annualPriceId : monthlyPriceId

  const origin = cleanEnv(request.headers.get('origin') ?? undefined)
    || cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
    || 'https://questoesenem.pro'

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

  return NextResponse.json({ url: session.url })
})
