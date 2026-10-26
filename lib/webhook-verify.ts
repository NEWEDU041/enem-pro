import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Logger } from 'pino'
import { logEvent, logError } from './logger'

/**
 * Webhook Signature Verification Module
 * 
 * Supports:
 * - Stripe: HMAC SHA-256 with stripe-signature header
 * - Anthropic: Bearer token validation in Authorization header
 */

export interface WebhookVerificationResult {
  valid: boolean
  error?: string
  timestamp?: string
  signature?: string
}

export interface WebhookLogEntry {
  timestamp: string
  provider: 'stripe' | 'anthropic'
  signature?: string
  result: 'success' | 'failure'
  reason?: string
  ipAddress?: string
}

/**
 * Log webhook events to storage or logging service
 * Currently logs to stdout via logger; can be extended to store in DB
 */
export function logWebhookEvent(
  logger: Logger,
  entry: WebhookLogEntry
) {
  logEvent(logger, `webhook_${entry.provider}`, {
    provider: entry.provider,
    result: entry.result,
    reason: entry.reason,
    timestamp: entry.timestamp,
    signature_hash: entry.signature ? hashSignature(entry.signature) : undefined,
    ip_address: entry.ipAddress,
  })
}

/**
 * Hash a signature for logging (never log raw signatures)
 * Uses SHA-256 first 16 chars for identification
 */
function hashSignature(sig: string): string {
  const hash = createHmac('sha256', 'signature-log-salt')
    .update(sig)
    .digest('hex')
  return hash.substring(0, 16)
}

/**
 * Verify Stripe webhook signature
 * 
 * Stripe uses HMAC SHA-256 with:
 * - Secret: STRIPE_WEBHOOK_SECRET (whsec_...)
 * - Headers: stripe-signature (t=timestamp,v1=signature)
 * - Body: Raw request body (NOT parsed JSON)
 * 
 * @param body Raw request body as string
 * @param signature stripe-signature header value
 * @param secret STRIPE_WEBHOOK_SECRET from env
 * @returns Verification result
 */
export function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  if (!signature) {
    return {
      valid: false,
      error: 'Missing stripe-signature header',
    }
  }

  if (!secret) {
    return {
      valid: false,
      error: 'STRIPE_WEBHOOK_SECRET not configured',
    }
  }

  // Parse stripe-signature header: t=timestamp,v1=signature_v1[,v0=signature_v0]
  const parts = signature.split(',').reduce((acc: Record<string, string>, part) => {
    const [key, value] = part.split('=')
    acc[key] = value
    return acc
  }, {})

  const timestamp = parts.t
  const signatureV1 = parts.v1

  if (!timestamp || !signatureV1) {
    return {
      valid: false,
      error: 'Invalid stripe-signature format',
    }
  }

  // Check timestamp is within 5 minutes (Stripe recommendation)
  const now = Math.floor(Date.now() / 1000)
  const signedTimestamp = parseInt(timestamp, 10)
  const timeDiff = Math.abs(now - signedTimestamp)

  if (timeDiff > 300) {
    return {
      valid: false,
      error: `Timestamp outside of 5-minute window (${timeDiff}s ago)`,
      timestamp: new Date(signedTimestamp * 1000).toISOString(),
    }
  }

  // Compute expected signature
  const signedContent = `${timestamp}.${body}`
  const expectedSignature = createHmac('sha256', secret)
    .update(signedContent)
    .digest('hex')

  // Compare signatures using timing-safe comparison
  try {
    const match = timingSafeEqual(
      Buffer.from(signatureV1),
      Buffer.from(expectedSignature)
    )
    return {
      valid: match,
      error: match ? undefined : 'Signature mismatch',
      timestamp: new Date(signedTimestamp * 1000).toISOString(),
      signature: hashSignature(signatureV1),
    }
  } catch {
    return {
      valid: false,
      error: 'Signature comparison failed',
      timestamp: new Date(signedTimestamp * 1000).toISOString(),
    }
  }
}

/**
 * Verify Anthropic webhook signature
 * 
 * Anthropic uses Bearer token validation:
 * - Header: Authorization: Bearer <token>
 * - Secret: ANTHROPIC_WEBHOOK_TOKEN (custom token, not API key)
 * 
 * @param authHeader Authorization header value (e.g., "Bearer token123")
 * @param secret ANTHROPIC_WEBHOOK_TOKEN from env
 * @returns Verification result
 */
export function verifyAnthropicSignature(
  authHeader: string,
  secret: string
): WebhookVerificationResult {
  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header',
    }
  }

  if (!secret) {
    return {
      valid: false,
      error: 'ANTHROPIC_WEBHOOK_TOKEN not configured',
    }
  }

  // Extract token from "Bearer token123" format
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match || !match[1]) {
    return {
      valid: false,
      error: 'Invalid Authorization header format (expected: Bearer <token>)',
    }
  }

  const token = match[1]

  // Compare tokens using timing-safe comparison
  try {
    const valid = timingSafeEqual(Buffer.from(token), Buffer.from(secret))
    return {
      valid,
      error: valid ? undefined : 'Token mismatch',
      signature: hashSignature(token),
    }
  } catch {
    return {
      valid: false,
      error: 'Token comparison failed',
    }
  }
}

/**
 * Middleware to verify and log Stripe webhooks
 * 
 * Usage in route handler:
 *   const verification = await verifyStripeWebhook(request, logger, logContext)
 *   if (!verification.valid) {
 *     return verification.response
 *   }
 *   // Process webhook...
 */
export async function verifyStripeWebhook(
  request: NextRequest,
  logger: Logger,
  context: any // LogContext
): Promise<{
  valid: boolean
  response?: NextResponse
  body?: string
}> {
  const signature = request.headers.get('stripe-signature') || ''
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip || 'unknown'

  // Get raw body
  let body: string
  try {
    body = await request.text()
  } catch (error) {
    const entry: WebhookLogEntry = {
      timestamp: new Date().toISOString(),
      provider: 'stripe',
      result: 'failure',
      reason: 'Failed to read request body',
      ipAddress,
    }
    logWebhookEvent(logger, entry)
    logError(logger, context, {
      status: 400,
      endpoint: '/api/webhooks/stripe',
      error: 'Failed to read request body',
    })

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      ),
    }
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const verification = verifyStripeSignature(body, signature, secret)

  const entry: WebhookLogEntry = {
    timestamp: new Date().toISOString(),
    provider: 'stripe',
    signature: verification.signature,
    result: verification.valid ? 'success' : 'failure',
    reason: verification.error,
    ipAddress,
  }
  logWebhookEvent(logger, entry)

  if (!verification.valid) {
    logError(logger, context, {
      status: 401,
      endpoint: '/api/webhooks/stripe',
      error: `Webhook signature verification failed: ${verification.error}`,
      metadata: {
        timestamp: verification.timestamp,
      },
    })

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 401 }
      ),
    }
  }

  return { valid: true, body }
}

/**
 * Middleware to verify and log Anthropic webhooks
 * 
 * Usage in route handler:
 *   const verification = await verifyAnthropicWebhook(request, logger, logContext)
 *   if (!verification.valid) {
 *     return verification.response
 *   }
 *   // Process webhook...
 */
export async function verifyAnthropicWebhook(
  request: NextRequest,
  logger: Logger,
  context: any // LogContext
): Promise<{
  valid: boolean
  response?: NextResponse
  body?: string
}> {
  const authHeader = request.headers.get('authorization') || ''
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip || 'unknown'

  // Get raw body
  let body: string
  try {
    body = await request.text()
  } catch (error) {
    const entry: WebhookLogEntry = {
      timestamp: new Date().toISOString(),
      provider: 'anthropic',
      result: 'failure',
      reason: 'Failed to read request body',
      ipAddress,
    }
    logWebhookEvent(logger, entry)
    logError(logger, context, {
      status: 400,
      endpoint: '/api/webhooks/anthropic',
      error: 'Failed to read request body',
    })

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      ),
    }
  }

  const secret = process.env.ANTHROPIC_WEBHOOK_TOKEN
  const verification = verifyAnthropicSignature(authHeader, secret)

  const entry: WebhookLogEntry = {
    timestamp: new Date().toISOString(),
    provider: 'anthropic',
    signature: verification.signature,
    result: verification.valid ? 'success' : 'failure',
    reason: verification.error,
    ipAddress,
  }
  logWebhookEvent(logger, entry)

  if (!verification.valid) {
    logError(logger, context, {
      status: 401,
      endpoint: '/api/webhooks/anthropic',
      error: `Webhook signature verification failed: ${verification.error}`,
    })

    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 401 }
      ),
    }
  }

  return { valid: true, body }
}
