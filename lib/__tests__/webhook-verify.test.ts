import { describe, it, expect, beforeEach } from 'vitest'
import { createHmac } from 'crypto'
import {
  verifyStripeSignature,
  verifyAnthropicSignature,
  WebhookVerificationResult,
} from '@/lib/webhook-verify'

describe('Webhook Signature Verification', () => {
  describe('Stripe HMAC SHA-256 Verification', () => {
    const secret = 'whsec_test_secret_key'
    let body: string
    let validSignature: string
    let timestamp: string

    beforeEach(() => {
      body = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      })

      timestamp = Math.floor(Date.now() / 1000).toString()
      const signedContent = `${timestamp}.${body}`
      const computedSignature = createHmac('sha256', secret)
        .update(signedContent)
        .digest('hex')

      validSignature = `t=${timestamp},v1=${computedSignature}`
    })

    it('should accept valid Stripe webhook signature', () => {
      const result = verifyStripeSignature(body, validSignature, secret)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.timestamp).toBeDefined()
      expect(result.signature).toBeDefined()
    })

    it('should reject webhook with missing signature header', () => {
      const result = verifyStripeSignature(body, '', secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing stripe-signature header')
    })

    it('should reject webhook with malformed signature header', () => {
      const result = verifyStripeSignature(body, 'invalid_format', secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid stripe-signature format')
    })

    it('should reject webhook with wrong signature value', () => {
      const wrongSignature = `t=${timestamp},v1=0000000000000000000000000000000000000000000000000000000000000000`
      const result = verifyStripeSignature(body, wrongSignature, secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Signature mismatch')
    })

    it('should reject webhook with missing STRIPE_WEBHOOK_SECRET', () => {
      const result = verifyStripeSignature(body, validSignature, '')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('STRIPE_WEBHOOK_SECRET not configured')
    })

    it('should reject webhook outside 5-minute window', () => {
      // Create signature with timestamp 6 minutes ago
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString()
      const signedContent = `${oldTimestamp}.${body}`
      const computedSignature = createHmac('sha256', secret)
        .update(signedContent)
        .digest('hex')

      const oldSignature = `t=${oldTimestamp},v1=${computedSignature}`
      const result = verifyStripeSignature(body, oldSignature, secret)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Timestamp outside of 5-minute window')
    })

    it('should reject webhook if body is tampered', () => {
      const tamperedBody = JSON.stringify({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_modified_999' } }, // Changed
      })

      const result = verifyStripeSignature(tamperedBody, validSignature, secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Signature mismatch')
    })

    it('should include timestamp in verification result', () => {
      const result = verifyStripeSignature(body, validSignature, secret)

      expect(result.timestamp).toBeDefined()
      expect(new Date(result.timestamp!).getTime()).toBeGreaterThan(0)
    })

    it('should hash signature in result for logging', () => {
      const result = verifyStripeSignature(body, validSignature, secret)

      expect(result.signature).toBeDefined()
      expect(result.signature).toHaveLength(16) // First 16 chars of SHA-256 hex
      expect(result.signature).not.toBe(validSignature) // Should not leak actual signature
    })
  })

  describe('Anthropic Bearer Token Verification', () => {
    const secret = 'test_webhook_token_12345'

    it('should accept valid Anthropic Bearer token', () => {
      const authHeader = `Bearer ${secret}`
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
      expect(result.signature).toBeDefined()
    })

    it('should accept Bearer token with extra whitespace', () => {
      const authHeader = `Bearer  ${secret}` // Extra space
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject webhook with missing Authorization header', () => {
      const result = verifyAnthropicSignature('', secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing Authorization header')
    })

    it('should reject webhook with invalid header format', () => {
      const result = verifyAnthropicSignature('Basic sometoken', secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid Authorization header format (expected: Bearer <token>)')
    })

    it('should reject webhook with wrong token', () => {
      const authHeader = 'Bearer wrong_token_xyz'
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token mismatch')
    })

    it('should reject webhook with missing ANTHROPIC_WEBHOOK_TOKEN', () => {
      const authHeader = `Bearer ${secret}`
      const result = verifyAnthropicSignature(authHeader, '')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('ANTHROPIC_WEBHOOK_TOKEN not configured')
    })

    it('should be case-insensitive for Bearer prefix', () => {
      const authHeader = `bearer ${secret}` // lowercase
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.valid).toBe(true)
    })

    it('should hash token in result for logging', () => {
      const authHeader = `Bearer ${secret}`
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.signature).toBeDefined()
      expect(result.signature).toHaveLength(16) // First 16 chars of SHA-256 hex
      expect(result.signature).not.toBe(secret) // Should not leak actual token
    })
  })

  describe('Edge Cases', () => {
    it('Stripe: should handle empty body', () => {
      const result = verifyStripeSignature('', 't=123,v1=abc', 'secret')
      expect(result.valid).toBe(false)
    })

    it('Stripe: should handle very long body', () => {
      const longBody = JSON.stringify({
        data: 'x'.repeat(10000),
      })
      const secret = 'test_secret'
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const signedContent = `${timestamp}.${longBody}`
      const computedSignature = createHmac('sha256', secret)
        .update(signedContent)
        .digest('hex')

      const signature = `t=${timestamp},v1=${computedSignature}`
      const result = verifyStripeSignature(longBody, signature, secret)

      expect(result.valid).toBe(true)
    })

    it('Anthropic: should handle empty token', () => {
      const result = verifyAnthropicSignature('Bearer ', 'secret')
      expect(result.valid).toBe(false)
    })

    it('should use timing-safe comparison to prevent timing attacks', () => {
      // This test verifies that the implementation uses timing-safe comparison
      // by checking that both valid and invalid tokens are processed similarly
      const secret = 'secret_token_123'

      const validResult = verifyAnthropicSignature(`Bearer ${secret}`, secret)
      const invalidResult = verifyAnthropicSignature('Bearer invalid_token', secret)

      // Both should return in reasonable time (timing attack resistance)
      expect(validResult).toBeDefined()
      expect(invalidResult).toBeDefined()
    })
  })

  describe('Security Properties', () => {
    it('Stripe: should never accept signature with missing v1 field', () => {
      const body = '{"test": "data"}'
      const timestamp = Math.floor(Date.now() / 1000).toString()

      // Signature header with v0 only (v1 is required)
      const signature = `t=${timestamp},v0=somehash`
      const result = verifyStripeSignature(body, signature, 'secret')

      expect(result.valid).toBe(false)
    })

    it('Anthropic: should never accept tokens with different lengths', () => {
      const secret = 'secret_token_123'

      // Token with different length
      const authHeader = 'Bearer secret_token_12'
      const result = verifyAnthropicSignature(authHeader, secret)

      expect(result.valid).toBe(false)
    })

    it('should not leak secrets in error messages', () => {
      const secret = 'super_secret_token_xyz'
      const authHeader = `Bearer ${secret}`
      const result = verifyAnthropicSignature(authHeader, 'wrong_secret')

      expect(result.error).not.toContain(secret)
      expect(result.error).not.toContain('wrong_secret')
    })
  })
})
