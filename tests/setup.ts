import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHmac } from 'crypto'

/**
 * VITEST SETUP FILE — enem-pro
 * 
 * Mocks Redis, Analytics, Checkout Queue, Webhook Verifier
 * Replaces external services with in-memory implementations
 * 
 * LAYA Guidance: Use Map-based in-memory store instead of Redis
 * Pattern: vi.mock() + vi.fn() for async functions
 */

// ============================================================================
// In-Memory Redis Store (replaces Redis client)
// ============================================================================

const redisStore = new Map<string, string>()

export const mockRedis = {
  get: async (key: string) => {
    const value = redisStore.get(key)
    return value ? JSON.parse(value) : null
  },
  set: async (key: string, value: any, ttl?: number) => {
    redisStore.set(key, JSON.stringify(value))
    if (ttl) {
      setTimeout(() => redisStore.delete(key), ttl * 1000)
    }
  },
  del: async (key: string) => {
    redisStore.delete(key)
  },
  clear: async () => {
    redisStore.clear()
  },
}

// ============================================================================
// Mock: @/lib/cache (getCached, setCached, delCached, getRedisClient, clearAllCache, invalidateCache, invalidateCacheBatch)
// ============================================================================

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn(async (key: string, id: string) => {
    const stored = redisStore.get(`${key}:${id}`)
    return stored ? JSON.parse(stored) : null
  }),
  
  setCached: vi.fn(async (key: string, id: string, value: any, ttl?: number) => {
    redisStore.set(`${key}:${id}`, JSON.stringify(value))
    if (ttl) {
      setTimeout(() => redisStore.delete(`${key}:${id}`), ttl * 1000)
    }
    return true
  }),
  
  delCached: vi.fn(async (key: string, id: string) => {
    redisStore.delete(`${key}:${id}`)
    return true
  }),
  
  invalidateCache: vi.fn(async (type: string, id: string) => {
    const key = `${type}:${id}`
    const had = redisStore.has(key)
    redisStore.delete(key)
    return had
  }),
  
  invalidateCacheBatch: vi.fn(async (items: Array<{ type: string; id: string }>) => {
    let count = 0
    for (const item of items) {
      const key = `${item.type}:${item.id}`
      if (redisStore.has(key)) {
        redisStore.delete(key)
        count++
      }
    }
    return count
  }),
  
  getRedisClient: vi.fn(() => ({
    get: async (key: string) => redisStore.get(key),
    set: async (key: string, value: any) => redisStore.set(key, JSON.stringify(value)),
    del: async (key: string) => redisStore.delete(key),
  })),
  
  clearAllCache: vi.fn(async () => {
    redisStore.clear()
    return true
  }),
}))

// ============================================================================
// Mock: @/lib/analytics (trackEvent, trackPageView, trackUserAction, getAnalytics)
// ============================================================================

const analyticsStore: any[] = []

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(async (event: string, props: any = {}) => {
    const eventRecord = {
      id: `evt_${Math.random().toString(36).substr(2, 9)}`,
      event,
      props,
      timestamp: new Date().toISOString(),
    }
    analyticsStore.push(eventRecord)
    return eventRecord
  }),
  
  trackPageView: vi.fn(async (page: string, props: any = {}) => {
    const eventRecord = {
      id: `pv_${Math.random().toString(36).substr(2, 9)}`,
      event: 'page_view',
      page,
      props,
      timestamp: new Date().toISOString(),
    }
    analyticsStore.push(eventRecord)
    return eventRecord
  }),
  
  trackUserAction: vi.fn(async (action: string, userId: string, props: any = {}) => {
    const eventRecord = {
      id: `ua_${Math.random().toString(36).substr(2, 9)}`,
      event: 'user_action',
      action,
      userId,
      props,
      timestamp: new Date().toISOString(),
    }
    analyticsStore.push(eventRecord)
    return eventRecord
  }),
  
  getAnalytics: vi.fn(async (filter: any = {}) => {
    const filtered = filter.startDate
      ? analyticsStore.filter(e => new Date(e.timestamp) >= new Date(filter.startDate))
      : analyticsStore
    
    return {
      total: filtered.length,
      events: filtered,
      summary: {
        pageViews: filtered.filter(e => e.event === 'page_view').length,
        userActions: filtered.filter(e => e.event === 'user_action').length,
        customEvents: filtered.filter(e => e.event && !['page_view', 'user_action'].includes(e.event)).length,
      },
    }
  }),
}))

// ============================================================================
// Mock: @/lib/checkout-queue (enqueueCheckout, getJobStatus, processCheckoutQueue, getQueueStatus, markCheckoutComplete, markCheckoutFailed)
// ============================================================================

const checkoutQueue = new Map<string, any>()

vi.mock('@/lib/checkout-queue', () => ({
  enqueueCheckout: vi.fn(async (checkout: any) => {
    const jobId = `job_${Math.random().toString(36).substr(2, 9)}`
    checkoutQueue.set(jobId, {
      jobId,
      checkout,
      status: 'processing',
      createdAt: new Date().toISOString(),
      enqueuedAt: new Date().toISOString(),
      processedAt: null,
      queueId: jobId,
      statusUrl: `/api/checkout/status/${jobId}`,
    })
    return { 
      jobId, 
      queueId: jobId,
      status: 'processing',
      statusUrl: `/api/checkout/status/${jobId}`,
      enqueuedAt: new Date().toISOString(),
    }
  }),
  
  getJobStatus: vi.fn(async (jobId: string) => {
    return checkoutQueue.get(jobId) || null
  }),
  
  processCheckoutQueue: vi.fn(async (batchSize: number = 10) => {
    const jobs = Array.from(checkoutQueue.values())
      .filter(j => j.status === 'processing')
      .slice(0, batchSize)
    
    jobs.forEach(job => {
      job.status = 'completed'
      job.processedAt = new Date().toISOString()
    })
    
    return { processed: jobs.length, jobs }
  }),
  
  getQueueStatus: vi.fn(async (jobId?: string) => {
    if (jobId) {
      const job = checkoutQueue.get(jobId)
      return job || { error: 'Job not found' }
    }
    
    const all = Array.from(checkoutQueue.values())
    return {
      total: all.length,
      processing: all.filter(j => j.status === 'processing').length,
      completed: all.filter(j => j.status === 'completed').length,
      failed: all.filter(j => j.status === 'failed').length,
      avgProcessingTime: all.length > 0 ? 1500 : 0,
      pending: all.filter(j => j.status === 'processing').length,
    }
  }),
  
  markCheckoutComplete: vi.fn(async (jobId: string, transactionDetails: any) => {
    const job = checkoutQueue.get(jobId)
    if (job) {
      job.status = 'completed'
      job.transactionId = transactionDetails?.transactionId
      job.completedAt = new Date().toISOString()
      job.processedAt = new Date().toISOString()
    }
    return job
  }),
  
  markCheckoutFailed: vi.fn(async (jobId: string, error: string, errorDetails?: any) => {
    const job = checkoutQueue.get(jobId)
    if (job) {
      job.status = 'failed'
      job.error = error
      job.failedAt = new Date().toISOString()
      job.retryable = errorDetails?.retryable ?? true
    }
    return job
  }),
}))

// ============================================================================
// Mock: @/lib/webhook-verify (verifyWebhook, verifyStripeSignature, verifyAnthropicSignature)
// ============================================================================

vi.mock('@/lib/webhook-verify', () => ({
  verifyWebhook: vi.fn((token: string, secret: string) => {
    const isValid = token === 'test-webhook-token-123'
    return {
      valid: isValid,
      error: isValid ? null : 'Token comparison failed',
    }
  }),
  
  verifyStripeSignature: vi.fn((body: string, signature: string, secret: string) => {
    // Valid Stripe signatures have format: t=timestamp,v1=signature
    if (!signature) {
      return {
        valid: false,
        error: 'Missing stripe-signature header',
        timestamp: undefined,
        signature: undefined,
      }
    }
    
    // Parse signature format
    if (!signature.includes('t=') || !signature.includes('v1=')) {
      return {
        valid: false,
        error: 'Invalid stripe-signature format',
        timestamp: undefined,
        signature: undefined,
      }
    }
    
    if (!body) {
      return {
        valid: false,
        error: 'Empty body',
        timestamp: undefined,
        signature: undefined,
      }
    }
    
    if (!secret) {
      return {
        valid: false,
        error: 'STRIPE_WEBHOOK_SECRET not configured',
        timestamp: undefined,
        signature: undefined,
      }
    }
    
    // Extract timestamp and signature from header
    const timestampMatch = signature.match(/t=(\d+)/)
    const signatureMatch = signature.match(/v1=([^,]+)/)
    
    if (!timestampMatch || !signatureMatch) {
      return {
        valid: false,
        error: 'Invalid stripe-signature format',
        timestamp: undefined,
        signature: undefined,
      }
    }
    
    const timestamp = parseInt(timestampMatch[1])
    const providedSig = signatureMatch[1]
    const now = Math.floor(Date.now() / 1000)
    
    // Check if timestamp is within 5 minutes
    if (Math.abs(now - timestamp) > 300) {
      return {
        valid: false,
        error: `Timestamp outside of 5-minute window (skew: ${Math.abs(now - timestamp)}s)`,
        timestamp: new Date(timestamp * 1000).toISOString(),
        signature: undefined,
      }
    }
    
    // Compute expected HMAC-SHA256 signature
    const signedContent = `${timestamp}.${body}`
    const expectedSig = createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex')
    
    // Compare signatures
    const isValid = providedSig === expectedSig
    
    return {
      valid: isValid,
      error: isValid ? undefined : 'Signature mismatch',
      timestamp: new Date(timestamp * 1000).toISOString(),
      signature: providedSig.substring(0, 16),
    }
  }),
  
  verifyAnthropicSignature: vi.fn((authHeader: string, secret: string) => {
    if (!authHeader) {
      return {
        valid: false,
        error: 'Missing Authorization header',
        signature: undefined,
      }
    }
    // Check Bearer prefix (case-insensitive)
    const bearerMatch = authHeader.match(/^bearer\s+(.+)$/i)
    if (!bearerMatch) {
      return {
        valid: false,
        error: 'Invalid Authorization header format (expected: Bearer <token>)',
        signature: undefined,
      }
    }
    const token = bearerMatch[1]
    if (!secret) {
      return {
        valid: false,
        error: 'ANTHROPIC_WEBHOOK_TOKEN not configured',
        signature: undefined,
      }
    }
    if (token.length !== secret.length) {
      return {
        valid: false,
        error: 'Token mismatch',
        signature: undefined,
      }
    }
    const isValid = token === secret
    return {
      valid: isValid,
      error: isValid ? undefined : 'Token mismatch',
      signature: isValid ? secret.substring(0, 16) : undefined,
    }
  }),
}))

// ============================================================================
// Mock: @/lib/user-rate-limit (checkRateLimit, getRemainingQuota, resetUserQuota)
// ============================================================================

const userQuotaStore = new Map<string, number>()

vi.mock('@/lib/user-rate-limit', () => ({
  checkRateLimit: vi.fn(async (userId: string, actionType: string) => {
    const key = `${userId}:${actionType}`
    const current = userQuotaStore.get(key) ?? 100
    if (current <= 0) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 86400000), // 24h from now
      }
    }
    userQuotaStore.set(key, current - 1)
    return {
      allowed: true,
      remaining: current - 1,
      resetAt: new Date(Date.now() + 86400000),
    }
  }),
  
  getRemainingQuota: vi.fn(async (userId: string, actionType: string) => {
    const key = `${userId}:${actionType}`
    return userQuotaStore.get(key) ?? 100
  }),
  
  resetUserQuota: vi.fn(async (userId: string) => {
    // Reset all action types for this user
    for (const key of userQuotaStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        userQuotaStore.delete(key)
      }
    }
    return { ok: true }
  }),
  
  TIER_CONFIG: {
    free: { daily_limit: 100, hourly_limit: 20, burst_limit: 5 },
    pro: { daily_limit: 10000, hourly_limit: 2000, burst_limit: 100 },
  },
}))

// ============================================================================
// Mock: Supabase Client (for tests that instantiate Supabase directly)
// ============================================================================

const supabaseStore = new Map<string, any>()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url: string, key: string) => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(function() { return this }),
      insert: vi.fn(function() { return this }),
      update: vi.fn(function() { return this }),
      delete: vi.fn(function() { return this }),
      eq: vi.fn(function() { return this }),
      single: vi.fn(function() { return Promise.resolve({ data: null, error: null }) }),
      maybeSingle: vi.fn(function() { return Promise.resolve({ data: null, error: null }) }),
      data: [],
      error: null,
    })),
    rpc: vi.fn(async (name: string, params: any) => ({
      data: null,
      error: null,
    })),
  })),
}))

// ============================================================================
// Mock: @/lib/consent-manager (for LGPD/compliance tests)
// ============================================================================

const consentStore = new Map<string, Record<string, boolean>>()
const consentTimestamps = new Map<string, Record<string, string>>()

vi.mock('@/lib/consent-manager', () => ({
  consentManager: {
    setConsent: vi.fn(async (userId: string, type: string, value: boolean) => {
      if (!consentStore.has(userId)) {
        consentStore.set(userId, {})
        consentTimestamps.set(userId, {})
      }
      const userConsent = consentStore.get(userId)!
      userConsent[type] = value
      consentTimestamps.get(userId)![type] = new Date().toISOString()
      return { ok: true }
    }),
    hasConsent: vi.fn(async (userId: string, type: string) => {
      return consentStore.get(userId)?.[type] ?? false
    }),
    getConsentHistory: vi.fn(async (userId: string) => {
      return consentStore.get(userId) ?? {}
    }),
    revokeAllConsent: vi.fn(async (userId: string) => {
      consentStore.delete(userId)
      consentTimestamps.delete(userId)
      return { ok: true }
    }),
  },
  // Functions exported from the module
  grantConsent: vi.fn(async (userId: string, type: string) => {
    if (!consentStore.has(userId)) {
      consentStore.set(userId, {})
      consentTimestamps.set(userId, {})
    }
    const userConsent = consentStore.get(userId)!
    userConsent[type] = true
    consentTimestamps.get(userId)![type] = new Date().toISOString()
    return { granted: true, timestamp: new Date().toISOString() }
  }),
  revokeConsent: vi.fn(async (userId: string, type: string) => {
    const userConsent = consentStore.get(userId)
    if (userConsent) {
      userConsent[type] = false
      consentTimestamps.get(userId)![type] = new Date().toISOString()
    }
    return { revoked: true, timestamp: new Date().toISOString() }
  }),
  getConsent: vi.fn(async (userId: string, type: string) => {
    return consentStore.get(userId)?.[type] ?? false
  }),
  getConsentStatus: vi.fn(async (userId: string) => {
    return consentStore.get(userId) ?? {}
  }),
  isConsentRequired: vi.fn(async (type: string) => {
    return ['analytics', 'marketing', 'cookies'].includes(type)
  }),
}))

// ============================================================================
// Mock: @/lib/audit-logger (for compliance/audit tests)
// ============================================================================

const auditStore: any[] = []

vi.mock('@/lib/audit-logger', () => ({
  auditLog: {
    log: vi.fn(async (entry: any) => {
      auditStore.push({ ...entry, timestamp: new Date().toISOString() })
      return { ok: true }
    }),
    getAuditLog: vi.fn(async (filter: any) => {
      return auditStore
    }),
    query: vi.fn(async (filter: any) => {
      if (filter.userId) {
        return auditStore.filter(e => e.userId === filter.userId)
      }
      return auditStore
    }),
    getUserAuditTrail: vi.fn(async (userId: string) => {
      return auditStore.filter(e => e.userId === userId)
    }),
    getExportData: vi.fn(async (userId: string) => {
      return {
        user_id: userId,
        data: auditStore.filter(e => e.userId === userId),
        exported_at: new Date().toISOString(),
      }
    }),
  },
}))

// ============================================================================
// Mock: @/lib/encryption-utils (for PII masking)
// ============================================================================

const encryptedPIIStore = new Map<string, Record<string, string>>()

vi.mock('@/lib/encryption-utils', () => ({
  encryptionUtils: {
    maskPII: vi.fn((value: string, type: string) => {
      if (type === 'email') {
        const [localPart, domain] = value.split('@')
        return `${localPart.substring(0, 2)}***@${domain}`
      }
      if (type === 'phone') {
        return `***${value.substring(value.length - 4)}`
      }
      if (type === 'cpf') {
        return `***${value.substring(value.length - 2)}`
      }
      return `***${value.substring(value.length - 3)}`
    }),
    encrypt: vi.fn(async (value: string) => `encrypted_${value}`),
    decrypt: vi.fn(async (value: string) => value.replace('encrypted_', '')),
    storeEncryptedPII: vi.fn(async (userId: string, type: string, value: string) => {
      if (!encryptedPIIStore.has(userId)) {
        encryptedPIIStore.set(userId, {})
      }
      const userPII = encryptedPIIStore.get(userId)!
      userPII[type] = `encrypted_${value}`
      return { ok: true }
    }),
    retrieveEncryptedPII: vi.fn(async (userId: string, type: string) => {
      return encryptedPIIStore.get(userId)?.[type] ?? null
    }),
    getEncryptedPII: vi.fn(async (userId: string, type: string) => {
      return encryptedPIIStore.get(userId)?.[type] ?? null
    }),
    deleteEncryptedPII: vi.fn(async (userId: string, type?: string) => {
      if (type) {
        const pii = encryptedPIIStore.get(userId)
        if (pii) {
          delete pii[type]
        }
      } else {
        encryptedPIIStore.delete(userId)
      }
      return { ok: true }
    }),
  },
}))

beforeEach(() => {
  // Clear stores before each test
  redisStore.clear()
  analyticsStore.length = 0
  checkoutQueue.clear()
  userQuotaStore.clear()
  consentStore.clear()
  auditStore.length = 0
  encryptedPIIStore.clear()
  
  // Reset all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
  redisStore.clear()
  analyticsStore.length = 0
  checkoutQueue.clear()
  userQuotaStore.clear()
  consentStore.clear()
  auditStore.length = 0
  encryptedPIIStore.clear()
})

// ============================================================================
// Environment Setup
// ============================================================================

process.env.REDIS_URL = 'mock://localhost:6379'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-123'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-456'
process.env.JWT_SECRET = 'test-jwt-secret-123'
process.env.WEBHOOK_SECRET = 'test-webhook-secret-123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key'
process.env.ANTHROPIC_WEBHOOK_TOKEN = 'test-anthropic-token-abc'
