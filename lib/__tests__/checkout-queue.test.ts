import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueueCheckout, getJobStatus, getRedisClient } from '@/lib/checkout-queue'

describe('checkout-queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should enqueue a checkout job and return jobId', async () => {
    const result = await enqueueCheckout({
      userId: 'test-user-1',
      email: 'test@example.com',
      plan: 'monthly',
      priceId: 'price_monthly_test',
      origin: 'https://example.com',
    })

    expect(result).toHaveProperty('jobId')
    expect(result).toHaveProperty('statusUrl')
    expect(result.statusUrl).toContain('/api/checkout/status/')
  })

  it('should retrieve job status after enqueue', async () => {
    const { jobId } = await enqueueCheckout({
      userId: 'test-user-2',
      email: 'test2@example.com',
      plan: 'annual',
      priceId: 'price_annual_test',
      origin: 'https://example.com',
    })

    // Immediately check status
    const status = await getJobStatus(jobId)

    expect(status).not.toBeNull()
    expect(status?.jobId).toBe(jobId)
    expect(status?.status).toBe('processing')
  })

  it('should return null for non-existent job', async () => {
    const status = await getJobStatus('non-existent-job-id-12345')
    expect(status).toBeNull()
  })

  it('enqueue should return within 100ms (fast HTTP 202)', async () => {
    const startTime = Date.now()

    const result = await enqueueCheckout({
      userId: 'test-user-3',
      email: 'test3@example.com',
      plan: 'monthly',
      priceId: 'price_monthly_test',
      origin: 'https://example.com',
    })

    const duration = Date.now() - startTime

    expect(result).toBeDefined()
    expect(duration).toBeLessThan(100) // Should be very fast
  })
})
