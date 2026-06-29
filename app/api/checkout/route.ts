import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripeKey = cleanEnv(process.env.STRIPE_SECRET_KEY)
  if (!stripeKey) return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })

  const monthlyPriceId = cleanEnv(process.env.STRIPE_PRICE_ID_MONTHLY)
  const annualPriceId = cleanEnv(process.env.STRIPE_PRICE_ID_ANNUAL)
  if (!monthlyPriceId || !annualPriceId) {
    return NextResponse.json({ error: 'Preços Stripe não configurados' }, { status: 503 })
  }

  const stripe = new Stripe(stripeKey)
  const supabase = createServerClient()

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

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
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${origin}/dashboard?upgrade=success&plan=${plan}`,
    cancel_url: `${origin}/planos`,
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: session.url })
}
