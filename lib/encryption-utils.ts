/**
 * Encryption Utilities - Using Supabase pgcrypto
 * Encrypts PII fields: email, phone, CPF
 * 
 * Note: This uses Supabase's built-in pgcrypto functions
 * For production, ensure:
 * 1. Encrypt key is strong (32+ chars)
 * 2. Keys are rotated
 * 3. Encrypted data is backed up
 * 
 * Usage (in SQL):
 * SELECT pgp_sym_decrypt(encrypted_email::bytea, 'secret_key')
 * 
 * Usage (in JS):
 * const encrypted = await encryptionUtils.encryptField('user@example.com', 'email');
 * const decrypted = await encryptionUtils.decryptField(encrypted, 'email');
 */

import { createClient } from '@supabase/supabase-js';

export type EncryptableField = 'email' | 'phone' | 'cpf' | 'ssn';

interface EncryptionConfig {
  field: EncryptableField;
  key: string; // Should be 32+ chars
  algorithm: 'pgp_sym_encrypt' | 'pgp_sym_decrypt';
}

class EncryptionUtils {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private encryptionKey = process.env.PII_ENCRYPTION_KEY || '';

  constructor() {
    if (!this.encryptionKey) {
      console.warn('⚠️ PII_ENCRYPTION_KEY not set - encryption disabled');
    }
  }

  /**
   * Encrypt a PII field using Supabase pgcrypto
   * Returns base64 encoded encrypted value
   */
  async encryptField(value: string, field: EncryptableField): Promise<string> {
    if (!this.encryptionKey) {
      console.warn(`Encryption disabled for ${field}`);
      return value;
    }

    try {
      // Use SQL to encrypt via pgp_sym_encrypt
      const { data, error } = await this.supabase
        .rpc('encrypt_pii', {
          plaintext: value,
          encryption_key: this.encryptionKey,
        });

      if (error) {
        console.error(`Encryption error for ${field}:`, error);
        // Fail open - return plaintext if encryption fails
        return value;
      }

      return data as string;
    } catch (error) {
      console.error(`Encryption exception for ${field}:`, error);
      return value;
    }
  }

  /**
   * Decrypt a PII field
   */
  async decryptField(encryptedValue: string, field: EncryptableField): Promise<string> {
    if (!this.encryptionKey) {
      console.warn(`Decryption disabled for ${field}`);
      return encryptedValue;
    }

    try {
      const { data, error } = await this.supabase
        .rpc('decrypt_pii', {
          ciphertext: encryptedValue,
          encryption_key: this.encryptionKey,
        });

      if (error) {
        console.error(`Decryption error for ${field}:`, error);
        return '';
      }

      return data as string;
    } catch (error) {
      console.error(`Decryption exception for ${field}:`, error);
      return '';
    }
  }

  /**
   * Store encrypted PII in dedicated table
   */
  async storeEncryptedPII(
    userId: string,
    field: EncryptableField,
    value: string
  ): Promise<boolean> {
    try {
      const encrypted = await this.encryptField(value, field);

      const { error } = await this.supabase
        .from('encrypted_pii')
        .upsert(
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
   * Retrieve encrypted PII
   */
  async getEncryptedPII(userId: string, field: EncryptableField): Promise<string> {
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

      return await this.decryptField(data.value, field);
    } catch (error) {
      console.error(`Get encrypted PII exception:`, error);
      return '';
    }
  }

  /**
   * Mask a PII field for logging/display
   * e.g., user@example.com -> u***@example.com
   */
  maskPII(value: string, field: EncryptableField): string {
    switch (field) {
      case 'email': {
        const [local, domain] = value.split('@');
        return `${local[0]}${'*'.repeat(Math.max(0, local.length - 1))}@${domain}`;
      }
      case 'phone':
      case 'cpf':
      case 'ssn':
        return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
      default:
        return '*'.repeat(value.length);
    }
  }
}

export const encryptionUtils = new EncryptionUtils();
