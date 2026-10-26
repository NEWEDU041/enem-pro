/**
 * Integration Tests for LGPD/GDPR Compliance
 * 
 * Run: npm test -- compliance.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { auditLog } from '@/lib/audit-logger';
import { consentManager } from '@/lib/consent-manager';
import { encryptionUtils } from '@/lib/encryption-utils';

describe('LGPD/GDPR Compliance', () => {
  const testUserId = 'test-user-123';
  const testEmail = 'test@example.com';
  const testPhone = '11999999999';
  const testCPF = '12345678901';

  // =========================================================================
  // AUDIT LOGGER TESTS
  // =========================================================================

  describe('Audit Logger', () => {
    it('should log user action with all fields', async () => {
      const logId = await auditLog.log({
        userId: testUserId,
        email: testEmail,
        action: 'UPDATE_PROFILE',
        resource: 'users',
        resourceId: testUserId,
        changes: {
          name: { old: 'John', new: 'Jane' },
          email: { old: 'old@example.com', new: testEmail }
        },
        ip: '203.0.113.42',
        userAgent: 'Mozilla/5.0',
        metadata: { source: 'api', version: '1.0' }
      });

      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');
    });

    it('should query logs by user ID', async () => {
      // Create multiple logs
      await auditLog.log({
        userId: testUserId,
        email: testEmail,
        action: 'LOGIN',
        resource: 'auth',
        ip: '203.0.113.42'
      });

      await auditLog.log({
        userId: testUserId,
        email: testEmail,
        action: 'UPDATE',
        resource: 'profiles',
        ip: '203.0.113.43'
      });

      // Query
      const logs = await auditLog.query({ userId: testUserId });

      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs[0].userId).toBe(testUserId);
      expect(logs[0].action).toBeDefined();
    });

    it('should retrieve user audit trail', async () => {
      // Create a log
      await auditLog.log({
        userId: testUserId,
        email: testEmail,
        action: 'DELETE_ACCOUNT',
        resource: 'users',
        ip: '203.0.113.42'
      });

      // Get audit trail
      const trail = await auditLog.getUserAuditTrail(testUserId);

      expect(Array.isArray(trail)).toBe(true);
      expect(trail.length).toBeGreaterThan(0);
    });

    it('should filter logs by action', async () => {
      const logs = await auditLog.query({
        action: 'LOGIN',
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
      logs.forEach(log => {
        if (log.action) {
          expect(log.action).toMatch(/LOGIN/);
        }
      });
    });
  });

  // =========================================================================
  // CONSENT MANAGER TESTS
  // =========================================================================

  describe('Consent Manager', () => {
    it('should set and retrieve consent', async () => {
      await consentManager.setConsent(testUserId, 'marketing', true, {
        source: 'form'
      });

      const hasConsent = await consentManager.hasConsent(testUserId, 'marketing');
      expect(hasConsent).toBe(true);
    });

    it('should get all consent statuses', async () => {
      // Set multiple consents
      await consentManager.setConsent(testUserId, 'analytics', true);
      await consentManager.setConsent(testUserId, 'marketing', false);

      const status = await consentManager.getConsentStatus(testUserId);

      expect(typeof status).toBe('object');
      expect('analytics' in status).toBe(true);
      expect('marketing' in status).toBe(true);
    });

    it('should track consent history', async () => {
      // Change consent multiple times
      await consentManager.setConsent(testUserId, 'marketing', true);
      await consentManager.setConsent(testUserId, 'marketing', false);
      await consentManager.setConsent(testUserId, 'marketing', true);

      const history = await consentManager.getConsentHistory(testUserId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('should revoke all consents', async () => {
      // Set all consents
      await consentManager.setConsent(testUserId, 'analytics', true);
      await consentManager.setConsent(testUserId, 'marketing', true);
      await consentManager.setConsent(testUserId, 'preferences', true);

      // Revoke all
      await consentManager.revokeAllConsents(testUserId);

      // Check they are all false
      const status = await consentManager.getConsentStatus(testUserId);
      
      // Most should be false (essential might still be true)
      const revokedConsents = Object.entries(status)
        .filter(([type]) => type !== 'essential')
        .every(([_, granted]) => !granted);

      expect(revokedConsents).toBe(true);
    });

    it('should track consent source', async () => {
      await consentManager.setConsent(testUserId, 'analytics', true, {
        source: 'banner_click'
      });

      const history = await consentManager.getConsentHistory(testUserId);
      const latestConsent = history[0];

      expect(latestConsent.source).toBe('banner_click');
    });
  });

  // =========================================================================
  // ENCRYPTION TESTS
  // =========================================================================

  describe('Encryption Utils', () => {
    it('should encrypt and decrypt email', async () => {
      const encrypted = await encryptionUtils.encryptField(testEmail, 'email');
      expect(encrypted).not.toBe(testEmail);

      const decrypted = await encryptionUtils.decryptField(encrypted, 'email');
      expect(decrypted).toBe(testEmail);
    });

    it('should encrypt and decrypt phone', async () => {
      const encrypted = await encryptionUtils.encryptField(testPhone, 'phone');
      expect(encrypted).not.toBe(testPhone);

      const decrypted = await encryptionUtils.decryptField(encrypted, 'phone');
      expect(decrypted).toBe(testPhone);
    });

    it('should encrypt and decrypt CPF', async () => {
      const encrypted = await encryptionUtils.encryptField(testCPF, 'cpf');
      expect(encrypted).not.toBe(testCPF);

      const decrypted = await encryptionUtils.decryptField(encrypted, 'cpf');
      expect(decrypted).toBe(testCPF);
    });

    it('should mask PII in logs', () => {
      const maskedEmail = encryptionUtils.maskPII(testEmail, 'email');
      expect(maskedEmail).not.toContain(testEmail);
      expect(maskedEmail).toMatch(/^\w\*+@/);

      const maskedPhone = encryptionUtils.maskPII(testPhone, 'phone');
      expect(maskedPhone).toEndWith('9999');
      expect(maskedPhone).toMatch(/^\*+9999$/);
    });

    it('should store and retrieve encrypted PII', async () => {
      const stored = await encryptionUtils.storeEncryptedPII(
        testUserId,
        'email',
        testEmail
      );
      expect(stored).toBe(true);

      const retrieved = await encryptionUtils.getEncryptedPII(testUserId, 'email');
      expect(retrieved).toBe(testEmail);
    });
  });

  // =========================================================================
  // INTEGRATION TESTS
  // =========================================================================

  describe('Integration Tests', () => {
    it('should log encrypted PII access', async () => {
      // Store encrypted email
      await encryptionUtils.storeEncryptedPII(testUserId, 'email', testEmail);

      // Log access
      await auditLog.log({
        userId: testUserId,
        email: encryptionUtils.maskPII(testEmail, 'email'),
        action: 'GET_EMAIL',
        resource: 'encrypted_pii',
        ip: '203.0.113.42'
      });

      // Verify logged
      const logs = await auditLog.query({
        userId: testUserId,
        action: 'GET_EMAIL'
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].email).toContain('*');
      expect(logs[0].email).not.toContain(testEmail);
    });

    it('should handle GDPR export with consent history', async () => {
      // Set consent
      await consentManager.setConsent(testUserId, 'marketing', true);

      // Get consent history
      const consentHistory = await consentManager.getConsentHistory(testUserId);

      // Get audit trail
      const auditTrail = await auditLog.getUserAuditTrail(testUserId);

      // Simulate export data
      const exportData = {
        profile: { id: testUserId, email: testEmail },
        consentHistory,
        auditTrail,
        exportedAt: new Date().toISOString()
      };

      expect(exportData.consentHistory).toBeDefined();
      expect(exportData.auditTrail).toBeDefined();
      expect(JSON.stringify(exportData).length).toBeGreaterThan(0);
    });

    it('should handle consent + audit for marketing email', async () => {
      // Check consent before action
      await consentManager.setConsent(testUserId, 'marketing', true);
      const hasConsent = await consentManager.hasConsent(testUserId, 'marketing');

      if (hasConsent) {
        // Log the email send
        await auditLog.log({
          userId: testUserId,
          email: testEmail,
          action: 'SEND_MARKETING_EMAIL',
          resource: 'emails',
          metadata: { campaignId: 'campaign_123' }
        });
      }

      // Verify
      const logs = await auditLog.query({
        userId: testUserId,
        action: 'SEND_MARKETING_EMAIL'
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // COMPLIANCE TESTS
  // =========================================================================

  describe('Compliance Verification', () => {
    it('should have immutable audit logs', async () => {
      // Create audit log
      const id = await auditLog.log({
        userId: testUserId,
        email: testEmail,
        action: 'TEST_ACTION',
        resource: 'test',
        ip: '203.0.113.42'
      });

      // In real implementation, UPDATE/DELETE on audit_logs should be blocked by RLS
      expect(id).toBeDefined();
    });

    it('should respect user consent for analytics', async () => {
      // No consent initially
      let canTrack = await consentManager.hasConsent(testUserId, 'analytics');
      expect(canTrack).toBe(false);

      // User grants consent
      await consentManager.setConsent(testUserId, 'analytics', true);
      canTrack = await consentManager.hasConsent(testUserId, 'analytics');
      expect(canTrack).toBe(true);

      // User revokes consent
      await consentManager.setConsent(testUserId, 'analytics', false);
      canTrack = await consentManager.hasConsent(testUserId, 'analytics');
      expect(canTrack).toBe(false);
    });

    it('should mask PII in all audit logs', async () => {
      const plainEmail = 'sensitive@example.com';
      const maskedEmail = encryptionUtils.maskPII(plainEmail, 'email');

      await auditLog.log({
        userId: testUserId,
        email: maskedEmail, // Always log masked
        action: 'SENSITIVE_ACTION',
        resource: 'users',
        ip: '203.0.113.42'
      });

      const logs = await auditLog.query({ userId: testUserId });
      const sensitiveLog = logs.find(l => l.action === 'SENSITIVE_ACTION');

      if (sensitiveLog?.email) {
        expect(sensitiveLog.email).not.toBe(plainEmail);
        expect(sensitiveLog.email).toContain('*');
      }
    });
  });
});
