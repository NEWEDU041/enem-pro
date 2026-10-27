/**
 * AES-256-GCM Encryption Utilities — LGPD PII Protection
 * Encrypts: CPF, email, phone numbers
 * Uses Node.js native crypto (no external deps)
 * 
 * AES-256-GCM provides:
 * - 256-bit symmetric encryption
 * - Authenticated encryption (AEAD) — detects tampering
 * - 96-bit nonce per encryption (random, prevents IV reuse)
 * 
 * Usage:
 *   const encrypted = encryptPII('11234567890', 'cpf');
 *   const decrypted = decryptPII(encrypted, 'cpf');
 */

import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export type EncryptableField = 'email' | 'phone' | 'cpf';

interface EncryptedPayload {
  iv: string; // hex-encoded initialization vector (nonce)
  authTag: string; // hex-encoded authentication tag
  ciphertext: string; // hex-encoded encrypted data
  salt: string; // hex-encoded salt for key derivation
}

class AES256GCMEncryption {
  private masterKey: string;
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor() {
    this.masterKey = process.env.ENCRYPTION_KEY || '';
    if (!this.masterKey) {
      console.warn('⚠️ ENCRYPTION_KEY not set — PII encryption disabled');
    }
  }

  /**
   * Derive encryption key from master key + salt using PBKDF2
   * Provides key stretching and prevents rainbow tables
   */
  private deriveKey(salt: Buffer): Buffer {
    if (!this.masterKey) {
      throw new Error('Encryption key not configured');
    }
    return pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha256'); // 32 bytes = 256 bits
  }

  /**
   * Encrypt a PII value using AES-256-GCM
   * Returns base64-encoded JSON: {iv, authTag, ciphertext, salt}
   */
  encryptPII(plaintext: string, field: EncryptableField): string {
    if (!this.masterKey) {
      console.warn(`Encryption disabled for ${field}`);
      return plaintext;
    }

    try {
      // Generate random 16-byte salt and 12-byte IV (nonce)
      const salt = randomBytes(16);
      const iv = randomBytes(12);

      // Derive encryption key from master key + salt
      const key = this.deriveKey(salt);

      // Create cipher (AES-256-GCM)
      const cipher = createCipheriv('aes-256-gcm', key, iv);

      // Encrypt the plaintext
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag (proves ciphertext hasn't been tampered with)
      const authTag = cipher.getAuthTag().toString('hex');

      // Return structured payload
      const payload: EncryptedPayload = {
        iv: iv.toString('hex'),
        authTag,
        ciphertext: encrypted,
        salt: salt.toString('hex'),
      };

      return Buffer.from(JSON.stringify(payload)).toString('base64');
    } catch (error) {
      console.error(`Encryption error for ${field}:`, error);
      // Fail-open: return plaintext if encryption fails
      return plaintext;
    }
  }

  /**
   * Decrypt a PII value encrypted with AES-256-GCM
   */
  decryptPII(encryptedData: string, field: EncryptableField): string {
    if (!this.masterKey) {
      console.warn(`Decryption disabled for ${field}`);
      return encryptedData;
    }

    try {
      // Parse base64-encoded payload
      const payload: EncryptedPayload = JSON.parse(
        Buffer.from(encryptedData, 'base64').toString('utf8')
      );

      // Reconstruct components from hex
      const iv = Buffer.from(payload.iv, 'hex');
      const authTag = Buffer.from(payload.authTag, 'hex');
      const salt = Buffer.from(payload.salt, 'hex');
      const ciphertext = payload.ciphertext;

      // Derive the same key using the stored salt
      const key = this.deriveKey(salt);

      // Create decipher
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error(`Decryption error for ${field}:`, error);
      return '';
    }
  }

  /**
   * Mask PII for logging/display (last 4 chars visible)
   * e.g., 11234567890 → ****67890
   */
  maskPII(value: string, field: EncryptableField): string {
    if (value.length <= 4) return '*'.repeat(value.length);

    switch (field) {
      case 'email': {
        const [local, domain] = value.split('@');
        if (!domain) return '*'.repeat(value.length);
        const visibleLocal = Math.max(1, Math.ceil(local.length / 3));
        return local.slice(0, visibleLocal) + '*'.repeat(local.length - visibleLocal) + '@' + domain;
      }
      case 'phone':
      case 'cpf':
        return '*'.repeat(value.length - 4) + value.slice(-4);
      default:
        return '*'.repeat(value.length);
    }
  }

  /**
   * Store encrypted PII in database
   */
  async storeEncryptedPII(
    userId: string,
    field: EncryptableField,
    value: string
  ): Promise<boolean> {
    try {
      const encrypted = this.encryptPII(value, field);

      const { error } = await this.supabase.from('encrypted_pii').upsert(
        {
          user_id: userId,
          field,
          value: encrypted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,field' }
      );

      if (error) {
        console.error(`Store encrypted PII error:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Store encrypted PII exception:`, error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt PII from database
   */
  async getDecryptedPII(userId: string, field: EncryptableField): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('encrypted_pii')
        .select('value')
        .eq('user_id', userId)
        .eq('field', field)
        .single();

      if (error || !data) {
        console.error(`Get encrypted PII error:`, error);
        return '';
      }

      return this.decryptPII(data.value, field);
    } catch (error) {
      console.error(`Get encrypted PII exception:`, error);
      return '';
    }
  }
}

// Singleton instance
export const encryption = new AES256GCMEncryption();
