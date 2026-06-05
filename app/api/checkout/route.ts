import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function cleanEnv(val: string | undefined): string {
  return (val || '').replace(new RegExp(String.fromCharCode(65279), 'g'), '').replace(/[\r\n]/g, '')
}

const stripe = new Stripe(cleanEnv(process.env.STRIPE_SECRET_KEY))

export async function POST(request: NextRequest) {
  const supabase = createServerClient()

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const body = await request.json()
  const plan = body.plan === 'annual' ? 'annual' : 'monthly'

  const priceId = plan === 'annual'
    ? cleanEnv(process.env.STRIPE_PRICE_ID_ANNUAL)
    : cleanEnv(process.env.STRIPE_PRICE_ID_MONTHLY)

  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://enem-pro-eight.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email,
    metadata: { user_id: user.id, plan },
    success_url: `${origin}/dashboard?upgrade=success`,
    cancel_url: `${origin}/planos`,
    locale: 'pt-BR',
  })

  return NextResponse.json({ url: session.url })
}
