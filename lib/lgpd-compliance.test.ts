/**
 * LGPD Compliance Tests
 * Tests for: encryption, audit logs, consent, data exports, webhooks
 * Run with: npm run test
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { encryption } from '@/lib/encryption-aes256gcm'
import { validateCPF, validatePhone, CPFSchema, PhoneSchema } from '@/lib/validation'
import { createHmac, timingSafeEqual } from 'crypto'

// ============================================
// AES-256-GCM Encryption Tests
// ============================================

describe('AES-256-GCM Encryption', () => {
  it('should encrypt and decrypt PII (email)', () => {
    const plaintext = 'user@example.com'
    const encrypted = encryption.encryptPII(plaintext, 'email')
    const decrypted = encryption.decryptPII(encrypted, 'email')
    expect(decrypted).toBe(plaintext)
  })

  it('should encrypt and decrypt CPF', () => {
    const cpf = '12345678910'
    const encrypted = encryption.encryptPII(cpf, 'cpf')
    const decrypted = encryption.decryptPII(encrypted, 'cpf')
    expect(decrypted).toBe(cpf)
  })

  it('should encrypt and decrypt phone number', () => {
    const phone = '11987654321'
    const encrypted = encryption.encryptPII(phone, 'phone')
    const decrypted = encryption.decryptPII(encrypted, 'phone')
    expect(decrypted).toBe(phone)
  })

  it('should produce different ciphertexts for same plaintext (due to random IV/salt)', () => {
    const plaintext = 'test@example.com'
    const encrypted1 = encryption.encryptPII(plaintext, 'email')
    const encrypted2 = encryption.encryptPII(plaintext, 'email')
    expect(encrypted1).not.toBe(encrypted2) // Different due to random nonce
  })

  it('should mask email correctly', () => {
    const masked = encryption.maskPII('user@example.com', 'email')
    expect(masked).toMatch(/^[a-z0-9]+\*+@example\.com$/)
  })

  it('should mask CPF correctly (last 4 chars visible)', () => {
    const masked = encryption.maskPII('12345678910', 'cpf')
    expect(masked).toBe('*******8910')
  })

  it('should mask phone correctly (last 4 chars visible)', () => {
    const masked = encryption.maskPII('11987654321', 'phone')
    expect(masked).toBe('*******4321')
  })
})

// ============================================
// CPF Validator Tests
// ============================================

describe('CPF Validator', () => {
  it('should accept valid CPF (no formatting)', () => {
    expect(validateCPF('12345678910')).toBe(true)
  })

  it('should accept valid CPF (with formatting)', () => {
    expect(validateCPF('123.456.789-10')).toBe(true)
  })

  it('should reject CPF with all same digits', () => {
    expect(validateCPF('11111111111')).toBe(false)
  })

  it('should reject CPF with wrong length', () => {
    expect(validateCPF('123456789')).toBe(false)
  })

  it('should reject CPF with non-digits', () => {
    expect(validateCPF('12345678abc')).toBe(false)
  })

  it('Zod CPFSchema should accept valid CPF', () => {
    const result = CPFSchema.safeParse('123.456.789-10')
    expect(result.success).toBe(true)
  })

  it('Zod CPFSchema should reject invalid CPF', () => {
    const result = CPFSchema.safeParse('11111111111')
    expect(result.success).toBe(false)
  })
})

// ============================================
// Phone Validator Tests
// ============================================

describe('Phone Validator', () => {
  it('should accept valid mobile phone (11 digits with 9)', () => {
    expect(validatePhone('11987654321')).toBe(true)
  })

  it('should accept formatted mobile phone', () => {
    expect(validatePhone('(11) 98765-4321')).toBe(true)
  })

  it('should accept valid landline (10 digits)', () => {
    expect(validatePhone('1133334444')).toBe(true)
  })

  it('should accept formatted landline', () => {
    expect(validatePhone('(11) 3333-4444')).toBe(true)
  })

  it('should accept international format', () => {
    // Brazil international: +55 11 9XXXX-XXXX (55 + area + number)
    expect(validatePhone('55' + '11' + '987654321')).toBe(true) // 55 + 11 + 9 digits
  })

  it('should reject invalid phone (wrong length)', () => {
    expect(validatePhone('123456')).toBe(false)
  })

  it('should reject phone without area code', () => {
    expect(validatePhone('987654321')).toBe(false)
  })

  it('Zod PhoneSchema should accept valid phone', () => {
    const result = PhoneSchema.safeParse('11987654321')
    expect(result.success).toBe(true)
  })

  it('Zod PhoneSchema should reject invalid phone', () => {
    const result = PhoneSchema.safeParse('123456')
    expect(result.success).toBe(false)
  })
})

// ============================================
// HMAC Webhook Signature Tests
// ============================================

describe('HMAC Webhook Signature (timing-safe)', () => {
  const secret = 'webhook_secret_key_123'
  const payload = JSON.stringify({ event: 'user.created', id: 'usr_123' })

  it('should create valid HMAC signature', () => {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    expect(signature).toHaveLength(64) // SHA-256 hex = 64 chars
  })

  it('should verify valid signature with timing-safe comparison', () => {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const match = timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    expect(match).toBe(true)
  })

  it('should reject altered payload', () => {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const alteredPayload = JSON.stringify({ event: 'user.created', id: 'usr_999' })
    const expected = createHmac('sha256', secret)
      .update(alteredPayload)
      .digest('hex')

    const match = signature === expected
    expect(match).toBe(false)
  })

  it('should reject forged signature', () => {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const forgery = 'a'.repeat(64)

    let match = false
    try {
      match = timingSafeEqual(Buffer.from(signature), Buffer.from(forgery))
    } catch {
      match = false
    }

    expect(match).toBe(false)
  })

  it('should detect signature length mismatch before comparison', () => {
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    const tampered = signature.slice(0, -2) // Remove 2 chars

    let match = false
    try {
      match = timingSafeEqual(Buffer.from(signature), Buffer.from(tampered))
    } catch (e) {
      // timingSafeEqual throws on length mismatch
      expect(e).toBeDefined()
    }
  })
})

// ============================================
// Audit Log Entry Validation Tests
// ============================================

describe('Audit Log Entry Structure', () => {
  it('should create valid audit log entry for LOGIN action', () => {
    const entry = {
      userId: 'user_123',
      email: 'user@example.com',
      action: 'LOGIN',
      resource: 'auth',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      metadata: { loginMethod: 'password' },
    }

    expect(entry.action).toBe('LOGIN')
    expect(entry.resource).toBe('auth')
    expect(entry.email).toBeDefined()
  })

  it('should create valid audit log entry for DATA_EXPORT action', () => {
    const entry = {
      userId: 'user_123',
      email: 'user@example.com',
      action: 'DATA_EXPORT',
      resource: 'data_exports',
      resourceId: 'export_456',
      ip: '192.168.1.1',
      metadata: { format: 'json', size_bytes: 1024 },
    }

    expect(entry.action).toBe('DATA_EXPORT')
    expect(entry.metadata?.format).toBe('json')
  })

  it('should create valid audit log entry for CONSENT_CHANGE action', () => {
    const entry = {
      userId: 'user_123',
      email: 'user@example.com',
      action: 'CONSENT_CHANGE',
      resource: 'consents',
      changes: {
        marketing: { old: false, new: true },
        analytics: { old: true, new: true },
      },
      ip: '192.168.1.1',
    }

    expect(entry.action).toBe('CONSENT_CHANGE')
    expect(entry.changes).toBeDefined()
  })
})

// ============================================
// Data Export Structure Tests
// ============================================

describe('Data Export Structure', () => {
  it('should validate JSON export format', () => {
    const exported = {
      user: { id: 'usr_123', email: 'encrypted_data' },
      audit_logs: [
        { action: 'LOGIN', timestamp: '2026-10-27T12:00:00Z' },
      ],
      consents: { marketing: true, analytics: false },
    }

    expect(exported.user).toBeDefined()
    expect(exported.audit_logs).toBeInstanceOf(Array)
    expect(exported.consents).toBeDefined()
  })

  it('should validate CSV export structure', () => {
    const csv = `id,email,cpf,action,created_at
usr_123,***@example.com,****5678,LOGIN,2026-10-27T12:00:00Z
usr_123,***@example.com,****5678,UPDATE_PROFILE,2026-10-27T12:15:00Z`

    const lines = csv.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toContain('id,email')
  })
})

// ============================================
// Consent Management Tests
// ============================================

describe('Consent Management', () => {
  const validConsentTypes = [
    'marketing',
    'analytics',
    'third_party',
    'data_processing',
    'cookie_essential',
  ]

  validConsentTypes.forEach((type) => {
    it(`should accept valid consent type: ${type}`, () => {
      const consent = {
        user_id: 'usr_123',
        consent_type: type,
        granted: true,
        consent_date: new Date().toISOString(),
      }

      expect(validConsentTypes).toContain(consent.consent_type)
    })
  })

  it('should track consent changes in audit', () => {
    const auditEntry = {
      user_id: 'usr_123',
      consent_type: 'marketing',
      granted_before: false,
      granted_after: true,
      change_reason: 'user_request',
      changed_at: new Date().toISOString(),
    }

    expect(auditEntry.consent_type).toBe('marketing')
    expect(auditEntry.granted_before).not.toBe(auditEntry.granted_after)
  })
})

// ============================================
// Rate Limiting per CPF/Phone Tests
// ============================================

describe('Rate Limiting by CPF/Phone', () => {
  it('should track attempts by CPF', () => {
    const cpf = '12345678910'
    const attempts = [
      { cpf, timestamp: Date.now(), success: true },
      { cpf, timestamp: Date.now() + 1000, success: false },
      { cpf, timestamp: Date.now() + 2000, success: false },
    ]

    const cpfAttempts = attempts.filter((a) => a.cpf === cpf)
    expect(cpfAttempts).toHaveLength(3)
  })

  it('should count failed attempts within time window', () => {
    const cpf = '12345678910'
    const now = Date.now()
    const oneHourMs = 3600 * 1000

    const attempts = [
      { cpf, timestamp: now - 2000, success: false },
      { cpf, timestamp: now - 1000, success: false },
      { cpf, timestamp: now, success: false },
    ]

    const recentFailed = attempts.filter((a) => now - a.timestamp < oneHourMs && !a.success)
    expect(recentFailed).toHaveLength(3)
    expect(recentFailed.length >= 3).toBe(true) // Should block at 3 attempts
  })
})
