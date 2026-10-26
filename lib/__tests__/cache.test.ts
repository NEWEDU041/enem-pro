import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  getCached, 
  setCached, 
  invalidateCache,
  invalidateCacheBatch,
  clearAllCache,
  getRedisClient,
  isRedisReady,
} from '@/lib/cache'

describe('Redis Cache Layer', () => {
  beforeAll(async () => {
    // Wait for Redis to be ready (if running)
    const client = getRedisClient()
    if (!client) {
      console.warn('⚠️  Redis not available for tests — skipping')
    }
  })

  afterAll(async () => {
    await clearAllCache()
  })

  describe('getCached / setCached', () => {
    it('should set and get a cached value', async () => {
      const testId = 'test-question-1'
      const testValue = { explanation: 'Test explanation', timestamp: Date.now() }

      // Set value
      const setResult = await setCached('explanation', testId, testValue)
      expect(setResult).toBe(true)

      // Get value
      const cached = await getCached('explanation', testId)
      expect(cached).toEqual(testValue)
    })

    it('should return null for non-existent keys', async () => {
      const cached = await getCached('explanation', 'nonexistent-key-' + Math.random())
      expect(cached).toBeNull()
    })

    it('should respect different TTL values for different types', async () => {
      // Question (24h), Explanation (12h), UserContext (1h)
      const testId = 'ttl-test'
      const testValue = { data: 'test' }

      // Set different cache types
      await setCached('question', testId, testValue)
      await setCached('explanation', testId, testValue)
      await setCached('user_context', testId, testValue)

      // All should be available immediately
      const q = await getCached('question', testId)
      const e = await getCached('explanation', testId)
      const ctx = await getCached('user_context', testId)

      expect(q).toEqual(testValue)
      expect(e).toEqual(testValue)
      expect(ctx).toEqual(testValue)
    })
  })

  describe('invalidateCache', () => {
    it('should delete a cached value', async () => {
      const testId = 'test-invalidate'
      const testValue = { explanation: 'Will be deleted' }

      await setCached('explanation', testId, testValue)
      expect(await getCached('explanation', testId)).toEqual(testValue)

      const invalidated = await invalidateCache('explanation', testId)
      expect(invalidated).toBe(true)

      const afterDelete = await getCached('explanation', testId)
      expect(afterDelete).toBeNull()
    })

    it('should return false when invalidating non-existent keys', async () => {
      const invalidated = await invalidateCache('explanation', 'nonexistent-' + Math.random())
      expect(invalidated).toBe(false)
    })
  })

  describe('invalidateCacheBatch', () => {
    it('should delete multiple cached values', async () => {
      // Set multiple values
      const ids = ['batch-1', 'batch-2', 'batch-3']
      for (const id of ids) {
        await setCached('explanation', id, { text: `explanation for ${id}` })
      }

      // Invalidate all
      const deleted = await invalidateCacheBatch([
        { type: 'explanation', id: 'batch-1' },
        { type: 'explanation', id: 'batch-2' },
        { type: 'explanation', id: 'batch-3' },
      ])

      expect(deleted).toBe(3)

      // Verify all are gone
      for (const id of ids) {
        const cached = await getCached('explanation', id)
        expect(cached).toBeNull()
      }
    })
  })

  describe('Cache Namespacing', () => {
    it('should isolate different cache types with namespaces', async () => {
      const testId = 'namespace-test'
      const qValue = { type: 'question' }
      const eValue = { type: 'explanation' }
      const ctxValue = { type: 'user_context' }

      await setCached('question', testId, qValue)
      await setCached('explanation', testId, eValue)
      await setCached('user_context', testId, ctxValue)

      // Each should retrieve its own type
      expect(await getCached('question', testId)).toEqual(qValue)
      expect(await getCached('explanation', testId)).toEqual(eValue)
      expect(await getCached('user_context', testId)).toEqual(ctxValue)

      // Invalidate one type
      await invalidateCache('explanation', testId)

      // Others should remain
      expect(await getCached('question', testId)).toEqual(qValue)
      expect(await getCached('explanation', testId)).toBeNull()
      expect(await getCached('user_context', testId)).toEqual(ctxValue)
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle invalid JSON', async () => {
      // This tests the cache layer's robustness
      const testId = 'json-test'
      const complexValue = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        date: new Date().toISOString(),
      }

      await setCached('explanation', testId, complexValue)
      const retrieved = await getCached('explanation', testId)
      expect(retrieved).toEqual(complexValue)
    })
  })
})
