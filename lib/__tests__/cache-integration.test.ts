import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { getCached, setCached, invalidateCache, clearAllCache } from '@/lib/cache'

/**
 * Integration tests for cached endpoints
 * 
 * These tests verify that:
 * 1. Cache operations work correctly
 * 2. Cache invalidation works
 * 3. Multi-layer cache (Redis → DB) works as expected
 */

describe('Endpoint Cache Integration', () => {
  beforeAll(async () => {
    await clearAllCache()
  })

  afterAll(async () => {
    await clearAllCache()
  })

  describe('/api/explicar Cache Flow', () => {
    it('should cache explanation after first fetch (L2→L1 promotion)', async () => {
      const questionId = 'test-2023-001'
      const explanation = 'This is a test explanation'

      // Simulate L2 cache hit
      await setCached('explanation', questionId, { explanation })

      // Verify L1 cache
      const cached = await getCached('explanation', questionId)
      expect(cached).toEqual({ explanation })
    })

    it('should invalidate explanation cache on update', async () => {
      const questionId = 'test-2023-002'
      const explanation = 'Original explanation'

      // Cache it
      await setCached('explanation', questionId, { explanation })
      expect(await getCached('explanation', questionId)).toBeTruthy()

      // Invalidate
      await invalidateCache('explanation', questionId)
      expect(await getCached('explanation', questionId)).toBeNull()
    })

    it('should support multiple cache types with same ID', async () => {
      const questionId = 'test-2023-003'

      // Cache different types
      await setCached('question', questionId, { title: 'Question text' })
      await setCached('explanation', questionId, { explanation: 'Explanation text' })

      // Both should exist independently
      const question = await getCached('question', questionId)
      const explanation = await getCached('explanation', questionId)

      expect(question).toEqual({ title: 'Question text' })
      expect(explanation).toEqual({ explanation: 'Explanation text' })
    })
  })

  describe('/api/portal Cache Flow', () => {
    it('should cache Stripe customer ID', async () => {
      const userId = 'user-123'
      const customerId = 'cus_ABC123'

      // Cache customer ID
      await setCached('stripe_customer', userId, { stripe_customer_id: customerId })

      // Verify
      const cached = await getCached('stripe_customer', userId)
      expect(cached?.stripe_customer_id).toBe(customerId)
    })

    it('should invalidate customer cache when subscription changes', async () => {
      const userId = 'user-456'
      const customerId = 'cus_DEF456'

      // Initial cache
      await setCached('stripe_customer', userId, { stripe_customer_id: customerId })
      expect(await getCached('stripe_customer', userId)).toBeTruthy()

      // Subscription updated → invalidate
      await invalidateCache('stripe_customer', userId)
      expect(await getCached('stripe_customer', userId)).toBeNull()
    })
  })

  describe('/api/checkout Cache Flow', () => {
    it('should cache Stripe price IDs', async () => {
      const monthlyPrice = 'price_monthly_123'
      const annualPrice = 'price_annual_456'

      // Cache prices
      await setCached('stripe_price', 'monthly', { price_id: monthlyPrice })
      await setCached('stripe_price', 'annual', { price_id: annualPrice })

      // Verify
      const monthly = await getCached('stripe_price', 'monthly')
      const annual = await getCached('stripe_price', 'annual')

      expect(monthly?.price_id).toBe(monthlyPrice)
      expect(annual?.price_id).toBe(annualPrice)
    })

    it('should maintain separate price caches', async () => {
      const oldMonthly = 'price_old_monthly'
      const newMonthly = 'price_new_monthly'

      // Initial cache
      await setCached('stripe_price', 'monthly', { price_id: oldMonthly })
      expect(await getCached('stripe_price', 'monthly')).toEqual({ price_id: oldMonthly })

      // Update price
      await setCached('stripe_price', 'monthly', { price_id: newMonthly })
      expect(await getCached('stripe_price', 'monthly')).toEqual({ price_id: newMonthly })
    })
  })

  describe('Cache Invalidation Strategy', () => {
    it('should handle bulk invalidation', async () => {
      // Cache multiple items
      const items = [
        { type: 'explanation' as const, id: 'q1', value: { explanation: 'A' } },
        { type: 'explanation' as const, id: 'q2', value: { explanation: 'B' } },
        { type: 'explanation' as const, id: 'q3', value: { explanation: 'C' } },
      ]

      for (const item of items) {
        await setCached(item.type, item.id, item.value)
      }

      // Verify all cached
      for (const item of items) {
        expect(await getCached(item.type, item.id)).toBeTruthy()
      }

      // Bulk invalidate (e.g., after bulk update)
      for (const item of items) {
        await invalidateCache(item.type, item.id)
      }

      // Verify all cleared
      for (const item of items) {
        expect(await getCached(item.type, item.id)).toBeNull()
      }
    })

    it('should handle selective invalidation', async () => {
      // Cache multiple items
      await setCached('explanation', 'keep-1', { explanation: 'Keep' })
      await setCached('explanation', 'delete-1', { explanation: 'Delete' })
      await setCached('explanation', 'keep-2', { explanation: 'Keep' })

      // Invalidate only middle item
      await invalidateCache('explanation', 'delete-1')

      // Verify
      expect(await getCached('explanation', 'keep-1')).toBeTruthy()
      expect(await getCached('explanation', 'delete-1')).toBeNull()
      expect(await getCached('explanation', 'keep-2')).toBeTruthy()
    })
  })

  describe('Cache Performance Characteristics', () => {
    it('should support high-frequency reads', async () => {
      const questionId = 'high-freq-test'
      const data = { explanation: 'Test' }

      await setCached('explanation', questionId, data)

      // Simulate high-frequency reads
      const readTimes: number[] = []
      for (let i = 0; i < 1000; i++) {
        const start = performance.now()
        await getCached('explanation', questionId)
        readTimes.push(performance.now() - start)
      }

      // All reads should be fast
      const avgTime = readTimes.reduce((a, b) => a + b) / readTimes.length
      expect(avgTime).toBeLessThan(10) // < 10ms average
    })

    it('should handle concurrent cache operations', async () => {
      const promises = []

      // Concurrent writes
      for (let i = 0; i < 100; i++) {
        promises.push(
          setCached('explanation', `concurrent-${i}`, { explanation: `Data ${i}` })
        )
      }

      const results = await Promise.all(promises)
      expect(results.every(r => r === true)).toBe(true)

      // Concurrent reads
      const readPromises = []
      for (let i = 0; i < 100; i++) {
        readPromises.push(
          getCached('explanation', `concurrent-${i}`)
        )
      }

      const readResults = await Promise.all(readPromises)
      expect(readResults.every(r => r?.explanation !== undefined)).toBe(true)
    })
  })

  describe('Cache Type Isolation', () => {
    it('should not mix different cache types', async () => {
      const id = 'isolation-test'

      // Set different types with same ID
      await setCached('question', id, { data: 'question' })
      await setCached('explanation', id, { data: 'explanation' })
      await setCached('user_context', id, { data: 'user_context' })
      await setCached('stripe_customer', id, { data: 'stripe_customer' })
      await setCached('stripe_price', id, { data: 'stripe_price' })

      // Each should return its own type
      const q = await getCached('question', id)
      const e = await getCached('explanation', id)
      const ctx = await getCached('user_context', id)
      const sc = await getCached('stripe_customer', id)
      const sp = await getCached('stripe_price', id)

      expect(q?.data).toBe('question')
      expect(e?.data).toBe('explanation')
      expect(ctx?.data).toBe('user_context')
      expect(sc?.data).toBe('stripe_customer')
      expect(sp?.data).toBe('stripe_price')
    })
  })
})
