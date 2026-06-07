import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
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

  const supabase = createServerClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    if (!userId) return NextResponse.json({ ok: true })

    const plan = (session.metadata?.plan as string) || 'monthly'
    const months = plan === 'annual' ? 12 : 1

    await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: 'pro',
        expires_at: addMonths(months),
        stripe_subscription_id: session.subscription as string,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    const isActive = sub.status === 'active' || sub.status === 'trialing'
    if (isActive && sub.current_period_end) {
      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          plan: 'pro',
          expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    await supabase.from('subscriptions')
      .update({ plan: 'free', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  return NextResponse.json({ ok: true })
}
