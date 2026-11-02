import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import crypto from 'crypto'
import { jsonWithSecurityHeaders, withSecurityHeaders } from '@/lib/middleware/security'

interface WebhookEvent {
  type: 'subscribe' | 'unsubscribe' | 'campaign' | 'list'
  fired_at: string
  data: {
    // Subscribe/Unsubscribe events
    email?: string
    id?: string
    email_type?: string
    merges?: Record<string, any>
    ip_signup?: string
    timestamp_signup?: number
    ip_opt?: string
    timestamp_opt?: number
    list_id?: string
    // Campaign events
    campaign_id?: string
    status?: string
    reason?: string
    subject?: string
    sent_at?: string
    reports?: {
      emails_sent?: number
      opens?: number
      clicks?: number
      unsubscribes?: number
      bounces?: number
      abuse_reports?: number
    }
  }
}

// Verify webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const hash = crypto
    .createHmac('sha1', secret)
    .update(body)
    .digest('base64')

  return hash === signature
}

/**
 * Mailchimp Webhook Handler
 * Handles subscribe, unsubscribe, and campaign events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-mailchimp-request-signature')
    const webhookSecret = process.env.MAILCHIMP_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('MAILCHIMP_WEBHOOK_SECRET not configured')
      return jsonWithSecurityHeaders({ error: 'Webhook secret not configured' }, 500)
    }

    // Verify webhook authenticity
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.warn('Invalid webhook signature')
      return jsonWithSecurityHeaders({ error: 'Invalid signature' }, 401)
    }

    const event: WebhookEvent = JSON.parse(body)
    const sb = createServerClient()

    // Log webhook event
    await sb.from('mailchimp_webhook_logs').insert({
      event_type: event.type,
      event_data: event,
      processed_at: new Date().toISOString(),
      status: 'processing',
    })

    // Handle different event types
    switch (event.type) {
      case 'subscribe':
        await handleSubscribe(event, sb)
        break

      case 'unsubscribe':
        await handleUnsubscribe(event, sb)
        break

      case 'campaign':
        await handleCampaignEvent(event, sb)
        break

      case 'list':
        await handleListEvent(event, sb)
        break

      default:
        console.log(`Unknown event type: ${event.type}`)
    }

    // Mark webhook as processed
    await sb
      .from('mailchimp_webhook_logs')
      .update({ status: 'processed' })
      .eq('event_type', event.type)
      .order('created_at', { ascending: false })
      .limit(1)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return jsonWithSecurityHeaders({ error: 'Webhook processing failed' }, 500)
  }
}

/**
 * Handle subscribe event
 */
async function handleSubscribe(event: WebhookEvent, sb: any) {
  const { email, merges, ip_signup, timestamp_signup } = event.data

  if (!email) return

  // Check if subscriber already exists
  const { data: existing } = await sb
    .from('subscribers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    // Update subscription status
    await sb
      .from('subscribers')
      .update({
        subscribed_at: new Date().toISOString(),
        mailchimp_synced_at: new Date().toISOString(),
        subscription_status: 'subscribed',
      })
      .eq('email', email)
  } else {
    // Insert new subscriber
    await sb.from('subscribers').insert({
      email,
      first_name: merges?.FNAME || '',
      last_name: merges?.LNAME || '',
      subscribed_at: new Date().toISOString(),
      mailchimp_synced_at: new Date().toISOString(),
      subscription_status: 'subscribed',
      ip_address: ip_signup || null,
      utm_source: 'mailchimp_webhook',
    })
  }

  console.log(`✅ Subscribe event: ${email}`)
}

/**
 * Handle unsubscribe event
 */
async function handleUnsubscribe(event: WebhookEvent, sb: any) {
  const { email, reason } = event.data

  if (!email) return

  await sb
    .from('subscribers')
    .update({
      subscription_status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: reason || null,
      mailchimp_synced_at: new Date().toISOString(),
    })
    .eq('email', email)

  console.log(`❌ Unsubscribe event: ${email}`)
}

/**
 * Handle campaign event (sent, opened, clicked, bounced)
 */
async function handleCampaignEvent(event: WebhookEvent, sb: any) {
  const {
    campaign_id,
    status,
    subject,
    sent_at,
    reports,
  } = event.data

  if (!campaign_id) return

  // Upsert campaign metrics
  await sb.from('campaign_metrics').upsert({
    mailchimp_campaign_id: campaign_id,
    campaign_name: subject,
    campaign_status: status,
    emails_sent: reports?.emails_sent || 0,
    opens: reports?.opens || 0,
    clicks: reports?.clicks || 0,
    unsubscribes: reports?.unsubscribes || 0,
    bounces: reports?.bounces || 0,
    abuse_reports: reports?.abuse_reports || 0,
    sent_at,
    updated_at: new Date().toISOString(),
  })

  console.log(`📊 Campaign event: ${campaign_id} - ${status}`)
}

/**
 * Handle list event (profile/email change, etc.)
 */
async function handleListEvent(event: WebhookEvent, sb: any) {
  const { email, list_id } = event.data

  if (!email || !list_id) return

  // Update subscriber profile if needed
  const { merges } = event.data

  if (merges) {
    await sb
      .from('subscribers')
      .update({
        first_name: merges.FNAME || '',
        last_name: merges.LNAME || '',
        mailchimp_synced_at: new Date().toISOString(),
      })
      .eq('email', email)
  }

  console.log(`📝 List event: ${email}`)
}
