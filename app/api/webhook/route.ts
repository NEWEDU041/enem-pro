import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'
import { getStripe } from '@/lib/stripe'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function addMonths(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })

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

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        plan: 'pro',
        expires_at: addMonths(months),
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    if (error) {
      console.error('[webhook] checkout.session.completed upsert failed:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    const isActive = sub.status === 'active' || sub.status === 'trialing'
    if (isActive) {
      const { error } = await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          plan: 'pro',
          expires_at: new Date(((sub as Stripe.Subscription & { current_period_end?: number }).current_period_end ?? 0) * 1000 || Date.now() + 30 * 864e5).toISOString(),
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      if (error) {
        console.error('[webhook] subscription.updated upsert failed:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    } else {
      // past_due, paused, incomplete_expired → rebaixa para free
      const { error } = await supabase.from('subscriptions')
        .update({ plan: 'free', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', userId)
      if (error) {
        console.error('[webhook] subscription.updated downgrade failed:', error.message)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (!userId) return NextResponse.json({ ok: true })

    const { error } = await supabase.from('subscriptions')
      .update({ plan: 'free', expires_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) {
      console.error('[webhook] subscription.deleted downgrade failed:', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
})
