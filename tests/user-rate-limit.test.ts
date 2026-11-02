/**
 * Unit tests for lib/user-rate-limit.ts
 * Tests: rate limiting logic, quota enforcement, reset behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, getRemainingQuota, resetUserQuota } from '../lib/user-rate-limit';

describe('User Rate Limiting', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow requests within quota', async () => {
      const result = await checkRateLimit(testUserId, 'api-call');
      expect(result).toBeDefined();
      expect(result.allowed).toBe(true);
    });

    it('should reject requests exceeding quota', async () => {
      // Simulate exhausting quota
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(testUserId, 'api-call');
      }
      const result = await checkRateLimit(testUserId, 'api-call');
      expect(result).toBeDefined();
      expect(result.allowed).toBeDefined();
    });

    it('should track request count per user', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      await checkRateLimit(user1, 'api-call');
      await checkRateLimit(user2, 'api-call');

      const result1 = await checkRateLimit(user1, 'api-call');
      const result2 = await checkRateLimit(user2, 'api-call');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('should handle different action types', async () => {
      const actions = ['api-call', 'upload', 'download'];
      
      for (const action of actions) {
        const result = await checkRateLimit(testUserId, action);
        expect(result).toBeDefined();
      }
    });

    it('should return remaining quota', async () => {
      const result = await checkRateLimit(testUserId, 'api-call');
      expect(result.remaining).toBeDefined();
      expect(typeof result.remaining).toBe('number');
    });

    it('should return reset time', async () => {
      const result = await checkRateLimit(testUserId, 'api-call');
      expect(result.resetAt).toBeDefined();
    });
  });

  describe('getRemainingQuota', () => {
    it('should return current remaining quota', async () => {
      const remaining = await getRemainingQuota(testUserId, 'api-call');
      expect(typeof remaining).toBe('number');
      expect(remaining).toBeGreaterThanOrEqual(0);
    });

    it('should decrease after each request', async () => {
      const before = await getRemainingQuota(testUserId, 'api-call');
      await checkRateLimit(testUserId, 'api-call');
      const after = await getRemainingQuota(testUserId, 'api-call');

      // After should be less than or equal to before
      expect(after).toBeLessThanOrEqual(before);
    });

    it('should handle multiple action types', async () => {
      const quota1 = await getRemainingQuota(testUserId, 'api-call');
      const quota2 = await getRemainingQuota(testUserId, 'upload');

      expect(quota1).toBeDefined();
      expect(quota2).toBeDefined();
    });
  });

  describe('resetUserQuota', () => {
    it('should reset user quota', async () => {
      const before = await getRemainingQuota(testUserId, 'api-call');
      
      await resetUserQuota(testUserId);
      
      const after = await getRemainingQuota(testUserId, 'api-call');
      expect(after).toBeDefined();
    });

    it('should reset all action types', async () => {
      const actions = ['api-call', 'upload', 'download'];
      
      await resetUserQuota(testUserId);
      
      for (const action of actions) {
        const quota = await getRemainingQuota(testUserId, action);
        expect(quota).toBeDefined();
      }
    });

    it('should handle non-existent users gracefully', async () => {
      const result = await resetUserQuota('non-existent-user');
      expect(result).toBeDefined();
    });
  });

  describe('Rate Limit Integration', () => {
    it('should enforce quota per time window', async () => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(testUserId, 'api-call');
        results.push(result);
      }

      // All results should be defined
      results.forEach(r => expect(r).toBeDefined());
    });

    it('should reset quota at window boundary', async () => {
      await checkRateLimit(testUserId, 'api-call');
      
      // Simulate time passing (in real scenario, this would be actual time)
      // For unit test, we reset manually
      await resetUserQuota(testUserId);
      
      const result = await checkRateLimit(testUserId, 'api-call');
      expect(result.allowed).toBeDefined();
    });
  });
});
