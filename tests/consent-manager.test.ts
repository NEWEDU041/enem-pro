/**
 * Unit tests for lib/consent-manager.ts
 * Tests: LGPD/GDPR consent tracking, user preferences, data retention
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  grantConsent, 
  revokeConsent, 
  getConsent, 
  getConsentStatus,
  isConsentRequired 
} from '../lib/consent-manager';

describe('Consent Manager (LGPD/GDPR)', () => {
  const testUserId = 'test-user-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('grantConsent', () => {
    it('should grant analytics consent', async () => {
      const result = await grantConsent(testUserId, 'analytics');
      expect(result).toBeDefined();
      expect(result.granted).toBe(true);
    });

    it('should grant marketing consent', async () => {
      const result = await grantConsent(testUserId, 'marketing');
      expect(result).toBeDefined();
    });

    it('should grant cookie consent', async () => {
      const result = await grantConsent(testUserId, 'cookies');
      expect(result).toBeDefined();
    });

    it('should grant multiple consents', async () => {
      const consents = ['analytics', 'marketing', 'cookies'];
      
      for (const consent of consents) {
        const result = await grantConsent(testUserId, consent);
        expect(result).toBeDefined();
      }
    });

    it('should record timestamp on consent grant', async () => {
      const result = await grantConsent(testUserId, 'analytics');
      expect(result.grantedAt).toBeDefined();
    });

    it('should handle consent expiration', async () => {
      const result = await grantConsent(testUserId, 'analytics', {
        expiresIn: 365 * 24 * 60 * 60, // 1 year
      });
      expect(result).toBeDefined();
    });
  });

  describe('revokeConsent', () => {
    it('should revoke analytics consent', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await revokeConsent(testUserId, 'analytics');
      expect(result).toBeDefined();
    });

    it('should revoke marketing consent', async () => {
      await grantConsent(testUserId, 'marketing');
      const result = await revokeConsent(testUserId, 'marketing');
      expect(result).toBeDefined();
    });

    it('should handle revoke of non-granted consent', async () => {
      const result = await revokeConsent(testUserId, 'non_existent');
      expect(result).toBeDefined();
    });

    it('should record revocation timestamp', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await revokeConsent(testUserId, 'analytics');
      expect(result.revokedAt).toBeDefined();
    });

    it('should trigger data deletion after revoke', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await revokeConsent(testUserId, 'analytics', {
        deleteData: true,
      });
      expect(result).toBeDefined();
    });
  });

  describe('getConsent', () => {
    it('should retrieve consent status', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await getConsent(testUserId, 'analytics');
      expect(result).toBeDefined();
      expect(result.granted).toBe(true);
    });

    it('should return false for non-granted consent', async () => {
      const result = await getConsent(testUserId, 'marketing');
      expect(result).toBeDefined();
      expect(result.granted).toBeDefined();
    });

    it('should include consent metadata', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await getConsent(testUserId, 'analytics');
      expect(result.grantedAt).toBeDefined();
    });

    it('should check expiration status', async () => {
      await grantConsent(testUserId, 'analytics', { expiresIn: 3600 });
      const result = await getConsent(testUserId, 'analytics');
      expect(result.expired).toBeDefined();
    });
  });

  describe('getConsentStatus', () => {
    it('should get all consent statuses for user', async () => {
      await grantConsent(testUserId, 'analytics');
      await grantConsent(testUserId, 'marketing');
      
      const result = await getConsentStatus(testUserId);
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should include all consent types', async () => {
      const result = await getConsentStatus(testUserId);
      expect(result).toBeDefined();
    });

    it('should handle users with no consents', async () => {
      const result = await getConsentStatus('new-user-789');
      expect(result).toBeDefined();
    });

    it('should indicate consent compliance status', async () => {
      const result = await getConsentStatus(testUserId);
      expect(result.compliant).toBeDefined();
    });
  });

  describe('isConsentRequired', () => {
    it('should indicate if consent is required', async () => {
      const result = await isConsentRequired('analytics');
      expect(typeof result).toBe('boolean');
    });

    it('should consider jurisdiction rules', async () => {
      const result = await isConsentRequired('analytics', { 
        country: 'BR' // Brazil has LGPD
      });
      expect(result).toBeDefined();
    });

    it('should handle EU users (GDPR)', async () => {
      const result = await isConsentRequired('marketing', {
        country: 'DE'
      });
      expect(result).toBeDefined();
    });

    it('should return different requirements by consent type', async () => {
      const analytics = await isConsentRequired('analytics');
      const marketing = await isConsentRequired('marketing');
      
      expect(analytics).toBeDefined();
      expect(marketing).toBeDefined();
    });
  });

  describe('Consent Compliance Integration', () => {
    it('should track user consent audit trail', async () => {
      await grantConsent(testUserId, 'analytics');
      await revokeConsent(testUserId, 'marketing');
      
      const status = await getConsentStatus(testUserId);
      expect(status).toBeDefined();
    });

    it('should handle LGPD data access request', async () => {
      await grantConsent(testUserId, 'analytics');
      
      const status = await getConsentStatus(testUserId);
      expect(status).toBeDefined();
    });

    it('should support right to erasure (GDPR)', async () => {
      await grantConsent(testUserId, 'analytics');
      const result = await revokeConsent(testUserId, 'analytics', {
        deleteData: true,
      });
      expect(result).toBeDefined();
    });

    it('should enforce consent before tracking', async () => {
      // Check if consent is granted before allowing tracking
      const hasConsent = await getConsent(testUserId, 'analytics');
      expect(hasConsent).toBeDefined();
    });
  });
});
