/**
 * Consent Manager - LGPD/GDPR
 * Tracks user consent for data collection, marketing, analytics, etc.
 * 
 * Usage:
 * const cm = new ConsentManager();
 * await cm.setConsent(userId, 'marketing', true, { source: 'form' });
 * const status = await cm.hasConsent(userId, 'marketing');
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export type ConsentType = 
  | 'essential'      // Required for operation
  | 'analytics'      // Google Analytics, Sentry
  | 'marketing'      // Email marketing, retargeting
  | 'preferences'    // Personalization
  | 'third_party';   // Third-party integrations

export interface ConsentRecord {
  id?: string;
  userId: string;
  email?: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: Date;
  source?: string; // 'form', 'api', 'auto', 'revoke'
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface ConsentStatus {
  [key in ConsentType]?: boolean;
}

class ConsentManager {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Set consent for a user
   */
  async setConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    options?: {
      email?: string;
      source?: string;
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<string> {
    try {
      const record: any = {
        id: uuidv4(),
        user_id: userId,
        email: options?.email,
        consent_type: consentType,
        granted,
        timestamp: new Date().toISOString(),
        source: options?.source || 'api',
        ip: options?.ip,
        user_agent: options?.userAgent,
        metadata: options?.metadata ? JSON.stringify(options.metadata) : null,
      };

      const { error } = await this.supabase
        .from('user_consents')
        .insert([record]);

      if (error) {
        console.error('Consent tracking error:', error);
        return '';
      }

      return record.id;
    } catch (error) {
      console.error('Consent manager exception:', error);
      return '';
    }
  }

  /**
   * Check if user has given consent for a type
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('granted')
        .eq('user_id', userId)
        .eq('consent_type', consentType)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Consent query error:', error);
        return false;
      }

      if (!data || data.length === 0) {
        return false;
      }

      return data[0].granted === true;
    } catch (error) {
      console.error('Consent check exception:', error);
      return false;
    }
  }

  /**
   * Get all consent statuses for a user
   */
  async getConsentStatus(userId: string): Promise<ConsentStatus> {
    try {
      const consentTypes: ConsentType[] = [
        'essential',
        'analytics',
        'marketing',
        'preferences',
        'third_party',
      ];

      const status: ConsentStatus = {};

      for (const type of consentTypes) {
        status[type] = await this.hasConsent(userId, type);
      }

      return status;
    } catch (error) {
      console.error('Get consent status exception:', error);
      return {};
    }
  }

  /**
   * Revoke all consents for a user (right to be forgotten)
   */
  async revokeAllConsents(userId: string, ip?: string): Promise<boolean> {
    try {
      const consentTypes: ConsentType[] = [
        'essential',
        'analytics',
        'marketing',
        'preferences',
        'third_party',
      ];

      for (const type of consentTypes) {
        await this.setConsent(userId, type, false, {
          source: 'revoke',
          ip,
        });
      }

      return true;
    } catch (error) {
      console.error('Revoke consents exception:', error);
      return false;
    }
  }

  /**
   * Get consent history for user
   */
  async getConsentHistory(userId: string, limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Consent history error:', error);
        return [];
      }

      return (data || []).map((record: any) => ({
        id: record.id,
        userId: record.user_id,
        email: record.email,
        consentType: record.consent_type,
        granted: record.granted,
        timestamp: new Date(record.timestamp),
        source: record.source,
        ip: record.ip,
        userAgent: record.user_agent,
        metadata: record.metadata ? JSON.parse(record.metadata) : null,
      }));
    } catch (error) {
      console.error('Consent history exception:', error);
      return [];
    }
  }
}

export const consentManager = new ConsentManager();
