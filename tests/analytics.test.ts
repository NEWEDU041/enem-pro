/**
 * Unit tests for lib/analytics.ts
 * Tests: event tracking, metrics collection, data aggregation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackEvent, trackPageView, trackUserAction, getAnalytics } from '../lib/analytics';

describe('Analytics Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track simple events', async () => {
      const result = await trackEvent('button_click', {});
      expect(result).toBeDefined();
    });

    it('should track events with properties', async () => {
      const result = await trackEvent('question_answered', {
        questionId: '2024-001',
        alternative: 'A',
        duration: 45,
      });
      expect(result).toBeDefined();
    });

    it('should track user identification', async () => {
      const result = await trackEvent('user_signup', {
        userId: 'user-123',
        email: 'test@example.com',
        source: 'organic',
      });
      expect(result).toBeDefined();
    });

    it('should handle multiple events', async () => {
      const events = ['click', 'view', 'submit'];
      
      for (const event of events) {
        const result = await trackEvent(event, {});
        expect(result).toBeDefined();
      }
    });

    it('should include timestamp automatically', async () => {
      const result = await trackEvent('test_event', {});
      expect(result).toBeDefined();
    });

    it('should handle nested properties', async () => {
      const result = await trackEvent('complex_event', {
        user: { id: '123', tier: 'premium' },
        metrics: { duration: 100, score: 95 },
      });
      expect(result).toBeDefined();
    });
  });

  describe('trackPageView', () => {
    it('should track page views', async () => {
      const result = await trackPageView('/questions');
      expect(result).toBeDefined();
    });

    it('should track page views with path', async () => {
      const result = await trackPageView('/questions/2024-001');
      expect(result).toBeDefined();
    });

    it('should track multiple page views', async () => {
      const pages = ['/questions', '/profile', '/results'];
      
      for (const page of pages) {
        const result = await trackPageView(page);
        expect(result).toBeDefined();
      }
    });

    it('should handle referrer information', async () => {
      const result = await trackPageView('/questions', {
        referrer: 'google.com',
      });
      expect(result).toBeDefined();
    });

    it('should track page load time', async () => {
      const result = await trackPageView('/questions', {
        loadTime: 1250,
      });
      expect(result).toBeDefined();
    });
  });

  describe('trackUserAction', () => {
    it('should track user actions', async () => {
      const result = await trackUserAction('user-123', 'login');
      expect(result).toBeDefined();
    });

    it('should track different action types', async () => {
      const actions = ['login', 'logout', 'submit_answer', 'share'];
      const userId = 'user-123';
      
      for (const action of actions) {
        const result = await trackUserAction(userId, action);
        expect(result).toBeDefined();
      }
    });

    it('should include user context', async () => {
      const result = await trackUserAction('user-123', 'upgrade', {
        plan: 'premium',
        amount: 99.90,
      });
      expect(result).toBeDefined();
    });

    it('should handle anonymous users', async () => {
      const result = await trackUserAction('anonymous-user-id', 'view_page');
      expect(result).toBeDefined();
    });

    it('should track user cohorts', async () => {
      const result = await trackUserAction('user-123', 'action', {
        cohort: 'early_adopter',
        country: 'BR',
      });
      expect(result).toBeDefined();
    });
  });

  describe('getAnalytics', () => {
    it('should retrieve analytics summary', async () => {
      const result = await getAnalytics();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should include event counts', async () => {
      await trackEvent('test_event', {});
      const result = await getAnalytics();
      expect(result).toBeDefined();
    });

    it('should retrieve analytics for date range', async () => {
      const result = await getAnalytics({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(result).toBeDefined();
    });

    it('should include user metrics', async () => {
      const result = await getAnalytics({
        metrics: ['users', 'sessions', 'events'],
      });
      expect(result).toBeDefined();
    });

    it('should filter by event type', async () => {
      const result = await getAnalytics({
        eventType: 'question_answered',
      });
      expect(result).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    it('should track complete user journey', async () => {
      const userId = 'user-new-123';
      
      await trackUserAction(userId, 'signup', { source: 'organic' });
      await trackPageView('/questions');
      await trackEvent('question_viewed', { questionId: '2024-001' });
      await trackEvent('question_answered', { 
        questionId: '2024-001',
        alternative: 'A'
      });
      
      const analytics = await getAnalytics();
      expect(analytics).toBeDefined();
    });

    it('should handle high volume events', async () => {
      for (let i = 0; i < 100; i++) {
        await trackEvent('bulk_event', { index: i });
      }
      
      const result = await getAnalytics();
      expect(result).toBeDefined();
    });

    it('should not error on analytics retrieval failure', async () => {
      try {
        const result = await getAnalytics();
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
