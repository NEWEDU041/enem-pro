# Encryption Strategy - PII Protection

## Overview

This document details the encryption strategy for protecting Personally Identifiable Information (PII) in accordance with LGPD/GDPR requirements.

---

## 1. Encryption Architecture

### Option A: Separate Encrypted PII Table (Selected)

```
┌─────────────────────────────────┐
│ profiles (unencrypted)          │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ name: TEXT                      │
│ created_at: TIMESTAMP           │
│ updated_at: TIMESTAMP           │
└─────────────────────────────────┘
         │
         │ user_id FK
         ↓
┌─────────────────────────────────┐
│ encrypted_pii (encrypted)       │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ user_id: UUID (FK)              │
│ field: 'email' | 'phone' | 'cpf'│
│ value: BYTEA (pgp encrypted)    │
│ updated_at: TIMESTAMP           │
└─────────────────────────────────┘
```

**Advantages:**
- Decouples encryption from regular queries
- Encrypted data never mixed with application logic
- Easier to rotate keys
- Minimal performance impact on unencrypted queries

**Disadvantages:**
- Extra JOIN required for PII queries
- Cache invalidation on PII changes

### Option B: In-Line Encrypted Columns (Not Selected)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email BYTEA, -- pgp_sym_encrypt('email', key)
  phone BYTEA, -- pgp_sym_encrypt('phone', key)
  name TEXT
);
```

**Not selected because:**
- Encryption overhead on every profile query
- Harder to manage key rotation
- Risk of accidental plaintext exposure

---

## 2. Encryption Method: PostgreSQL pgcrypto

### Why pgcrypto?

- ✅ Built into PostgreSQL (Supabase)
- ✅ Battle-tested, secure
- ✅ No external API calls
- ✅ Transparent to application layer
- ✅ Hardware-accelerated on modern systems

### Algorithm: AES-256

```sql
pgp_sym_encrypt(plaintext, key) -- 256-bit AES
pgp_sym_decrypt(ciphertext, key)
```

---

## 3. Key Management

### Key Generation

```bash
# Generate 32-byte (256-bit) base64-encoded key
openssl rand -base64 32
# Example output: 7d5A3kL9mB2cQ6wE8xY1vU3hJ4tN5sR7pO9mK2lQ8vW6xZ=
```

### Storage

**Never commit keys to git!**

```bash
# .env.local (gitignored)
PII_ENCRYPTION_KEY=7d5A3kL9mB2cQ6wE8xY1vU3hJ4tN5sR7pO9mK2lQ8vW6xZ=

# Supabase dashboard
Settings > Database > Connection string > Env vars
```

### Multiple Keys (Key Versioning)

For gradual key rotation:

```typescript
interface EncryptionKeyVersion {
  id: number;
  key: string;
  algorithm: string;
  status: 'active' | 'rotating' | 'retired';
  createdAt: Date;
  rotatedAt?: Date;
  retiredAt?: Date;
}

// Store in encrypted_pii table
{
  user_id: 'user123',
  field: 'email',
  value: BYTEA, // Encrypted with key version 2
  key_version: 2, // Track which key encrypted this
  updated_at: TIMESTAMP
}
```

---

## 4. Encryption/Decryption Flow

### Encryption at Insert/Update

```typescript
async function createProfile(email: string, name: string) {
  // 1. Encrypt PII
  const encryptedEmail = await encryptionUtils.encryptField(email, 'email');

  // 2. Store in encrypted_pii table
  await encryptionUtils.storeEncryptedPII(userId, 'email', email);
  // (internally: encrypts and stores)

  // 3. Store unencrypted data in profiles
  await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: name,
      // email NOT stored here
    });
}
```

### Decryption at Read

```typescript
async function getProfile(userId: string) {
  // 1. Fetch unencrypted profile
  const profile = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // 2. Decrypt PII on demand
  const email = await encryptionUtils.getEncryptedPII(userId, 'email');

  return { ...profile, email };
}
```

### Masking PII in Logs

```typescript
// Don't log plaintext emails
const maskedEmail = encryptionUtils.maskPII('user@example.com', 'email');
// Returns: u***@example.com

auditLog.log({
  email: maskedEmail, // Log masked version
  action: 'LOGIN'
});
```

---

## 5. Key Rotation Procedure

### Step 1: Prepare New Key

```bash
# Generate new key
NEW_KEY=7d5A3kL9mB2cQ6wE8xY1vU3hJ4tN5sR7pO9mK2lQ8vW6xZ=

# Store in secure location (not in code)
# Test in staging environment first
```

### Step 2: Create Rotation Plan

```sql
-- Create rotation record
INSERT INTO key_rotations (
  old_key_id, new_key_id, status, started_at
) VALUES (1, 2, 'in_progress', now());
```

### Step 3: Decrypt with Old Key → Encrypt with New Key

```typescript
async function rotateEncryptionKey(oldKey: string, newKey: string) {
  const encryptedPII = await supabase
    .from('encrypted_pii')
    .select('*')
    .eq('key_version', 1);

  for (const record of encryptedPII) {
    // Decrypt with old key
    const plaintext = await decryptPII(record.value, oldKey);

    // Encrypt with new key
    const newEncrypted = await encryptPII(plaintext, newKey);

    // Update record
    await supabase
      .from('encrypted_pii')
      .update({
        value: newEncrypted,
        key_version: 2
      })
      .eq('id', record.id);
  }
}
```

### Step 4: Verify & Complete

```sql
-- Verify all records rotated
SELECT COUNT(*), key_version
FROM encrypted_pii
GROUP BY key_version;

-- Mark rotation complete
UPDATE key_rotations
SET status = 'completed', completed_at = now()
WHERE id = 1;
```

### Step 5: Retire Old Key

```sql
-- After 30 days (grace period)
UPDATE key_rotations
SET status = 'retired', retired_at = now()
WHERE id = 1;

-- Delete old key from env
```

---

## 6. Performance Considerations

### Query Performance

```sql
-- GOOD: Fast (indexed on user_id)
SELECT value FROM encrypted_pii
WHERE user_id = 'user123' AND field = 'email'
LIMIT 1;

-- BAD: Slow (requires full table scan + decryption)
SELECT * FROM encrypted_pii
WHERE pgp_sym_decrypt(value, key) LIKE '%example.com%';
```

### Caching Strategy

```typescript
// Cache decrypted PII in memory (short-lived)
const emailCache = new Map<string, string>();

async function getEmail(userId: string) {
  if (emailCache.has(userId)) {
    return emailCache.get(userId); // Cache hit: 1ms
  }

  const email = await encryptionUtils.getEncryptedPII(userId, 'email');
  emailCache.set(userId, email);

  // Auto-clear after 5 minutes
  setTimeout(() => emailCache.delete(userId), 5 * 60 * 1000);

  return email;
}
```

### Batch Operations

```typescript
// Don't encrypt one-by-one in loops
const encrypted = [];
for (const email of emails) {
  // ❌ SLOW: N database calls
  encrypted.push(await encryptionUtils.encryptField(email, 'email'));
}

// ✅ FAST: Batch insert
await supabase
  .from('encrypted_pii')
  .insert(
    emails.map(email => ({
      user_id: userId,
      field: 'email',
      value: pgp_sym_encrypt(email, key) // Direct SQL
    }))
  );
```

---

## 7. Security Best Practices

### 1. Never Log Plaintext PII

```typescript
// ❌ DON'T
console.log('Email:', email); // Plaintext in logs!

// ✅ DO
console.log('Email:', encryptionUtils.maskPII(email, 'email'));
```

### 2. Minimize Plaintext Exposure

```typescript
// ❌ DON'T: Keep plaintext in memory
const email = decryptedEmail;
// ... 100 lines later still in scope ...

// ✅ DO: Decrypt only when needed
const sendEmail = async () => {
  const email = await getEncryptedPII(userId, 'email');
  await emailService.send(email);
  // Garbage collected after function ends
};
```

### 3. Encrypt Before Storage

```typescript
// ❌ DON'T: Store plaintext temporarily
const email = 'user@example.com';
await db.store(email); // Plain in DB!

// ✅ DO: Encrypt before insert
const encrypted = await encryptionUtils.encryptField(email, 'email');
await encryptionUtils.storeEncryptedPII(userId, 'email', email);
```

### 4. Validate Key Integrity

```typescript
async function validateEncryptionKey() {
  try {
    // Try encrypt/decrypt round-trip
    const test = 'test@example.com';
    const encrypted = await encryptPII(test, key);
    const decrypted = await decryptPII(encrypted, key);

    if (decrypted !== test) {
      throw new Error('Key integrity check failed');
    }

    return true;
  } catch (error) {
    console.error('Encryption key invalid:', error);
    return false;
  }
}
```

### 5. Monitor Encryption Errors

```typescript
// Track failed encryptions
class EncryptionMonitor {
  private failureCount = 0;

  async encryptWithFallback(plaintext: string) {
    try {
      return await encryptField(plaintext, 'email');
    } catch (error) {
      this.failureCount++;

      if (this.failureCount > 100) {
        // Alert: Encryption service degraded
        await alerting.critical('Encryption failures increasing');
      }

      // Fail open (don't lose data)
      console.warn('Encryption failed, storing plaintext');
      return plaintext;
    }
  }
}
```

---

## 8. Compliance Verification

### Verify Encryption is Active

```sql
-- Check encrypted_pii table exists
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'encrypted_pii'
);

-- Check pgcrypto extension
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Verify encrypted values are BYTEA
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'encrypted_pii' AND column_name = 'value';
```

### Audit Encryption Usage

```sql
-- Track which fields are encrypted
SELECT
  field,
  COUNT(*) as encrypted_count,
  MAX(updated_at) as last_updated
FROM encrypted_pii
GROUP BY field;
```

### Test Key Access Control

```sql
-- Only service_role should have direct key access
GRANT USAGE ON SCHEMA PUBLIC TO authenticated;
REVOKE EXECUTE ON FUNCTION decrypt_pii FROM authenticated;
GRANT EXECUTE ON FUNCTION decrypt_pii TO service_role;
```

---

## 9. Disaster Recovery

### Backup Encryption Keys

```bash
# Export key (with strong password protection)
openssl enc -aes-256-cbc -in key.txt -out key.txt.enc

# Store in:
1. Password manager (LastPass/1Password)
2. Hardware key (YubiKey)
3. Secure backup service (AWS Secrets Manager)
```

### Lost Key Recovery

⚠️ **If encryption key is lost: Data is irrecoverable**

Mitigation:
1. Automatic key backups
2. Redundant key storage
3. Regular key access tests
4. Documented recovery procedures

### Data Restoration

```sql
-- If needed to restore from backup with old key
-- 1. Restore database from backup
-- 2. Use old key to decrypt
-- 3. Re-encrypt with new key (key rotation)
-- 4. Verify data integrity
```

---

## 10. Testing Checklist

- [ ] Encryption/decryption round-trip works
- [ ] Encrypted data cannot be read without key
- [ ] Plaintext never appears in logs
- [ ] Key rotation procedure tested in staging
- [ ] Performance acceptable (<100ms per operation)
- [ ] Backup keys accessible for recovery
- [ ] RLS policies prevent unauthorized decryption
- [ ] Audit trail logs encryption operations

---

## References

- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [NIST Encryption Guidelines](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [OWASP Data Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [LGPD Security Requirements](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

---

**Last Updated:** October 26, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
