import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function cleanEnv(val: string | undefined): string {
  return (val || '').replace(new RegExp(String.fromCharCode(65279), 'g'), '').replace(/[\r\n]/g, '')
}

export async function POST(request: NextRequest) {
  const stripeKey = cleanEnv(process.env.STRIPE_SECRET_KEY)
  if (!stripeKey) return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })
  const stripe = new Stripe(stripeKey)
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, cleanEnv(process.env.STRIPE_WEBHOOK_SECRET))
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    if (!userId) return NextResponse.json({ ok: true })

    const plan = (session.metadata?.plan as string) || 'monthly'
    const months = plan === 'annual' ? 12 : 1
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)

    const supabase = createServerClient()
    await supabase.from('subscriptions').upsert(
      { user_id: userId, plan: 'pro', expires_at: expiresAt.toISOString(), stripe_subscription_id: session.subscription as string },
      { onConflict: 'user_id' }
    )
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    const supabase = createServerClient()
    await supabase.from('subscriptions')
      .update({ plan: 'free', expires_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}
