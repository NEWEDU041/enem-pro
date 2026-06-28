// Webhook queue for async processing
// Pattern: Fire webhook processing async, return 202 immediately
// Processing happens in background without blocking response

import { createServerClient } from './supabase'

export interface WebhookEvent {
  id: string
  type: string
  data: any
  processedAt?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  retryCount: number
  maxRetries: number
}

/**
 * Queue a webhook event for async processing
 * Returns immediately (202 Accepted)
 */
export async function queueWebhookEvent(
  eventType: string,
  eventData: any,
  maxRetries: number = 3
): Promise<string> {
  const sb = createServerClient()

  const eventId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const { data, error } = await sb.from('webhook_queue').insert({
    id: eventId,
    type: eventType,
    data: eventData,
    status: 'pending',
    retryCount: 0,
    maxRetries,
    createdAt: new Date().toISOString(),
  })

  if (error) {
    console.error('[webhook-queue] Insert error:', error)
    throw error
  }

  // Trigger background processing (non-blocking)
  void processWebhookAsync(eventId)

  return eventId
}

/**
 * Process a single webhook event
 * Called async (fire-and-forget)
 */
async function processWebhookAsync(eventId: string) {
  try {
    const sb = createServerClient()

    const { data: event } = await sb
      .from('webhook_queue')
      .select('*')
      .eq('id', eventId)
      .maybeSingle()

    if (!event) return

    // Mark as processing
    await sb.from('webhook_queue').update({ status: 'processing' }).eq('id', eventId)

    // Process based on type
    const result = await processWebhookByType(event)

    // Mark as completed
    await sb.from('webhook_queue').update({
      status: 'completed',
      processedAt: new Date().toISOString(),
    }).eq('id', eventId)

    return result
  } catch (error) {
    console.error(`[webhook-queue] Error processing ${eventId}:`, error)

    // Retry logic
    const sb = createServerClient()
    const { data: event } = await sb
      .from('webhook_queue')
      .select('retryCount, maxRetries')
      .eq('id', eventId)
      .maybeSingle()

    if (event && event.retryCount < event.maxRetries) {
      // Retry after delay (exponential backoff)
      const delay = Math.pow(2, event.retryCount) * 1000 // 1s, 2s, 4s
      setTimeout(() => {
        void processWebhookAsync(eventId)
      }, delay)

      // Update retry count
      await sb.from('webhook_queue').update({
        retryCount: event.retryCount + 1,
      }).eq('id', eventId)
    } else {
      // Max retries exceeded
      await sb.from('webhook_queue').update({
        status: 'failed',
        processedAt: new Date().toISOString(),
      }).eq('id', eventId)
    }
  }
}

/**
 * Process webhook based on type
 */
async function processWebhookByType(event: WebhookEvent): Promise<any> {
  switch (event.type) {
    case 'stripe.checkout.session.completed':
      return await handleCheckoutSession(event.data)
    case 'stripe.customer.subscription.updated':
      return await handleSubscriptionUpdated(event.data)
    case 'stripe.customer.subscription.deleted':
      return await handleSubscriptionDeleted(event.data)
    default:
      console.warn(`[webhook-queue] Unknown event type: ${event.type}`)
      return null
  }
}

/**
 * Handle Stripe checkout.session.completed
 */
async function handleCheckoutSession(data: any) {
  const sb = createServerClient()
  const userId = data.client_reference_id
  if (!userId) return

  const plan = (data.metadata?.plan as string) || 'monthly'
  const months = plan === 'annual' ? 12 : 1

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  await sb.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: 'pro',
      expires_at: expiresAt.toISOString(),
      stripe_subscription_id: data.subscription as string,
      stripe_customer_id: data.customer as string,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  console.log(`[webhook] Processed checkout for user ${userId}`)
}

/**
 * Handle Stripe subscription.updated
 */
async function handleSubscriptionUpdated(data: any) {
  const sb = createServerClient()

  // Find user by stripe_subscription_id
  const { data: subscription } = await sb
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', data.id)
    .maybeSingle()

  if (!subscription) return

  // Update status based on Stripe status
  await sb.from('subscriptions').update({
    stripe_status: data.status,
    updated_at: new Date().toISOString(),
  }).eq('user_id', subscription.user_id)

  console.log(`[webhook] Updated subscription for user ${subscription.user_id}`)
}

/**
 * Handle Stripe subscription.deleted
 */
async function handleSubscriptionDeleted(data: any) {
  const sb = createServerClient()

  // Find user by stripe_subscription_id
  const { data: subscription } = await sb
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', data.id)
    .maybeSingle()

  if (!subscription) return

  // Mark as cancelled
  await sb.from('subscriptions').update({
    stripe_status: 'canceled',
    expires_at: new Date().toISOString(), // Immediate expiration
    updated_at: new Date().toISOString(),
  }).eq('user_id', subscription.user_id)

  console.log(`[webhook] Cancelled subscription for user ${subscription.user_id}`)
}
