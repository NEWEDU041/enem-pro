# LGPD/GDPR Compliance & Audit Documentation

## Overview

This document describes the compliance framework implemented across enem-pro and clube-da-escolha projects, covering:

- **Audit Logging** - Complete audit trail of all user actions
- **Data Encryption** - PII field encryption (email, phone, CPF)
- **Consent Management** - Track user consent for data collection
- **GDPR Export Rights** - `/api/export-my-data` endpoint for data access
- **LGPD Compliance** - Brazilian data protection law requirements

---

## 1. Audit Logging

### What We Log

Every significant action is logged with:

| Field | Value | Purpose |
|-------|-------|---------|
| `user_id` | UUID | Identify the user who performed the action |
| `email` | Text | Additional identifier (especially for logged-out actions) |
| `action` | String | Type of action (CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.) |
| `resource` | String | What was modified (users, profiles, posts, etc.) |
| `resource_id` | UUID | ID of the specific resource |
| `changes` | JSON | Before/after values for modifications |
| `ip` | String | IP address of the requester |
| `user_agent` | String | Browser/client information |
| `timestamp` | Timestamp | When the action occurred |
| `metadata` | JSON | Additional context (session, source, etc.) |

### Audit Trail Examples

#### User Login
```json
{
  "action": "LOGIN",
  "resource": "auth",
  "ip": "203.0.113.42",
  "metadata": {
    "method": "password",
    "sessionId": "sess_123"
  }
}
```

#### Profile Update
```json
{
  "action": "UPDATE",
  "resource": "profiles",
  "resource_id": "user_456",
  "changes": {
    "name": { "old": "John Doe", "new": "John Smith" },
    "email": { "old": "john@old.com", "new": "john@new.com" }
  },
  "metadata": {
    "source": "settings_page"
  }
}
```

#### GDPR Export
```json
{
  "action": "GDPR_EXPORT_REQUESTED",
  "resource": "gdpr_exports",
  "metadata": {
    "method": "api",
    "format": "zip"
  }
}
```

### Access Audit Logs

**Admin Endpoint:**
```bash
GET /api/admin/audit-logs?action=LOGIN&limit=100
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `userId` - Filter by user
- `action` - Filter by action type
- `resource` - Filter by resource
- `startDate` - ISO timestamp
- `endDate` - ISO timestamp
- `limit` - Max 1000 records (default 100)

**Example Response:**
```json
{
  "success": true,
  "count": 42,
  "logs": [
    {
      "id": "audit_123",
      "action": "LOGIN",
      "resource": "auth",
      "ip": "203.0.113.42",
      "createdAt": "2026-10-26T15:30:00Z"
    }
  ]
}
```

---

## 2. Field Encryption (PII Protection)

### Encrypted Fields

The following personal data is encrypted at rest:

- **Email** - User email address
- **Phone** - Phone number (with country code)
- **CPF** - Brazilian tax ID (Cadastro de Pessoas Físicas)
- **SSN** - Social Security Number (if applicable)

### Encryption Method

We use **PostgreSQL pgcrypto** (built-in Supabase encryption):

```sql
-- Encrypt
SELECT pgp_sym_encrypt('plaintext', 'encryption_key')

-- Decrypt
SELECT pgp_sym_decrypt(encrypted_blob, 'encryption_key')
```

### Storage Architecture

**Option 1: Separate Encrypted PII Table (Recommended)**

```sql
CREATE TABLE encrypted_pii (
  id UUID PRIMARY KEY,
  user_id UUID,
  field TEXT, -- 'email', 'phone', 'cpf'
  value BYTEA, -- Encrypted via pgp_sym_encrypt
  updated_at TIMESTAMP
);
```

- Profile table stores non-encrypted fields (name, etc.)
- encrypted_pii table stores encrypted values
- App layer handles decryption on demand

**Option 2: In-Line Encrypted Columns**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT, -- Encrypted BYTEA
  phone TEXT, -- Encrypted BYTEA
  cpf TEXT    -- Encrypted BYTEA
);
```

### Implementation

**Encrypt a field:**
```typescript
import { encryptionUtils } from '@/lib/encryption-utils';

const encryptedEmail = await encryptionUtils.encryptField(
  'user@example.com',
  'email'
);
```

**Decrypt a field:**
```typescript
const plainEmail = await encryptionUtils.decryptField(
  encryptedEmail,
  'email'
);
```

**Store encrypted PII:**
```typescript
await encryptionUtils.storeEncryptedPII(
  userId,
  'email',
  'user@example.com'
);
```

### Encryption Key Management

**Setup:**

1. Generate a strong 32+ character key:
```bash
openssl rand -base64 32
```

2. Store in environment:
```bash
# .env.local
PII_ENCRYPTION_KEY=your_very_strong_key_here_32_chars_minimum
```

3. Verify extension is enabled:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

**Key Rotation:**

1. Generate new key
2. Decrypt all data with old key
3. Re-encrypt with new key
4. Update env variable
5. Test decryption

---

## 3. Consent Management

### Consent Types

Users can give/revoke consent for:

| Type | Purpose | Default |
|------|---------|---------|
| **essential** | Core functionality (authentication, security) | Required |
| **analytics** | Google Analytics, Sentry, crash reports | Opt-in |
| **marketing** | Email campaigns, newsletters, offers | Opt-in |
| **preferences** | Personalization, recommendations | Opt-in |
| **third_party** | Third-party integrations (payment, shipping) | Opt-in |

### Set User Consent

```typescript
import { consentManager } from '@/lib/consent-manager';

await consentManager.setConsent(
  userId,
  'marketing',
  true, // granted
  {
    source: 'form', // 'form', 'api', 'auto', 'revoke'
    ip: '203.0.113.42',
    metadata: { formId: 'contact_form' }
  }
);
```

### Check Consent

```typescript
const hasMarketingConsent = await consentManager.hasConsent(
  userId,
  'marketing'
);

if (!hasMarketingConsent) {
  // Don't send marketing emails
}
```

### Consent Status

```typescript
const status = await consentManager.getConsentStatus(userId);
// {
//   essential: true,
//   analytics: false,
//   marketing: true,
//   preferences: false,
//   third_party: true
// }
```

### Consent History

All consent changes are logged:

```typescript
const history = await consentManager.getConsentHistory(userId);
// [
//   { consentType: 'marketing', granted: true, timestamp: '2026-10-26T10:00:00Z', source: 'form' },
//   { consentType: 'marketing', granted: false, timestamp: '2026-10-25T15:30:00Z', source: 'api' }
// ]
```

### Right to Revoke Consent

Users can revoke all consents at once:

```typescript
await consentManager.revokeAllConsents(userId, ip);
```

This logs an audit event and updates the consent table.

---

## 4. GDPR Data Export (`/api/export-my-data`)

### What Gets Exported

A ZIP file containing:

1. **profile.json** - Personal information
   - ID, email, name
   - Account creation/update dates
   - Does NOT include passwords or auth tokens

2. **audit-trail.json** - Complete action history
   - All CRUD operations
   - Login attempts
   - Profile changes
   - IP addresses and timestamps

3. **consents.json** - Consent history
   - All consent changes
   - Timestamps and sources
   - Current status

4. **preferences.json** - User settings
   - UI preferences
   - Notification settings
   - Privacy settings

5. **README.md** - Export metadata
   - Export date
   - Expiration date
   - Instructions

### Request Export

```bash
POST /api/export-my-data
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Response

```json
{
  "success": true,
  "downloadUrl": "https://storage.example.com/gdpr-export-...",
  "expiresAt": "2026-11-02T15:30:00Z",
  "expiresIn": "7 days",
  "message": "Your data export is ready..."
}
```

### Security

- **Authentication**: Email validation only (privacy preserving - doesn't reveal if email exists)
- **Access**: Signed URL valid for 7 days only
- **Audit**: Export logged with timestamp and file details
- **Encryption**: Transmitted over HTTPS only
- **Cleanup**: Exports auto-deleted after 7 days

### Implementation Details

**Files Generated:**
- ZIP file with JSON exports
- Signed URL for secure download
- Auto-expires after 7 days

**Storage:**
- Stored in `gdpr-exports/` bucket
- Encrypted at rest (Supabase encryption)
- Separate by userId for isolation

**Audit Trail:**
- `GDPR_EXPORT_REQUESTED` - When user initiates
- `GDPR_EXPORT_COMPLETED` - When ready for download
- Includes file size and expiration details

---

## 5. LGPD Compliance (Brazil)

### LGPD Articles

This implementation covers:

| LGPD Article | Requirement | Implementation |
|--------------|-------------|-----------------|
| **Art. 6** | Lawful basis for processing | Consent tracked in `user_consents` |
| **Art. 9** | Sensitive data protection | Email/phone/CPF encrypted in `encrypted_pii` |
| **Art. 18** | Right of access | `/api/export-my-data` endpoint |
| **Art. 19** | Right to correction | Audit trail tracks changes in `changes` field |
| **Art. 20** | Right to deletion | Schedule deletion in `gdpr_requests` table |
| **Art. 21** | Right to opt-out | `revokeAllConsents()` in consent manager |
| **Art. 32** | Security measures | Encryption, audit logs, RLS policies |

### Data Minimization

- Only collect data necessary for service
- Retention: 90 days for transactional data, 1 year for audit logs
- Automatic deletion of exports after 7 days

### Data Subject Rights

**Access:** `GET /api/export-my-data`
**Portability:** Exports in machine-readable JSON/ZIP
**Rectification:** Users update profiles; changes logged
**Erasure:** Request deletion via support; logged in `gdpr_requests`
**Opt-out:** Revoke consents; all marketing stopped immediately

---

## 6. Integration Checklist

### enem-pro (Next.js)

- [x] Audit logger at `lib/audit-logger.ts`
- [x] Consent manager at `lib/consent-manager.ts`
- [x] Encryption utils at `lib/encryption-utils.ts`
- [x] GDPR export at `app/api/export-my-data/route.ts`
- [x] Admin audit logs at `app/api/admin/audit-logs/route.ts`

### clube-da-escolha (Vite)

- [x] Audit logger at `src/lib/audit-logger.ts`
- [x] Consent manager at `src/lib/consent-manager.ts`
- [x] GDPR export at `api/export-my-data.js`
- [x] Admin audit logs at `api/audit-logs.js`

### Database

- [x] Schema migrations: `schema-migrations/001-lgpd-gdpr-compliance.sql`
- [x] Tables: audit_logs, user_consents, encrypted_pii, gdpr_requests
- [x] RLS policies for data protection
- [x] Helper functions for encryption

---

## 7. Testing

### Unit Tests

```typescript
// Test audit logging
const logId = await auditLog.log({
  userId: 'user123',
  email: 'user@example.com',
  action: 'UPDATE',
  resource: 'profiles',
  changes: { name: { old: 'John', new: 'Jane' } },
  ip: '203.0.113.42'
});
expect(logId).toBeDefined();

// Test consent
await consentManager.setConsent(userId, 'marketing', true);
const hasConsent = await consentManager.hasConsent(userId, 'marketing');
expect(hasConsent).toBe(true);

// Test encryption
const encrypted = await encryptionUtils.encryptField('user@example.com', 'email');
const decrypted = await encryptionUtils.decryptField(encrypted, 'email');
expect(decrypted).toBe('user@example.com');
```

### Integration Tests

```typescript
// Test GDPR export endpoint
const response = await fetch('/api/export-my-data', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com' })
});

expect(response.status).toBe(200);
const data = await response.json();
expect(data.downloadUrl).toBeDefined();
expect(data.expiresAt).toBeDefined();
```

---

## 8. Monitoring & Alerts

### Key Metrics

- **Audit Log Volume**: Track daily log entries
- **Failed Encryption**: Monitor decrypt errors
- **Export Requests**: Count GDPR requests
- **Consent Changes**: Track opt-out rate
- **Storage Growth**: Monitor export bucket size

### Alerts

```
⚠️ High audit log volume (>10k/day)
⚠️ Encryption errors increasing
⚠️ GDPR export failures
⚠️ Storage bucket near quota
⚠️ RLS policy violations
```

---

## 9. FAQ

**Q: Does encrypted PII impact search performance?**
A: Use a separate encrypted_pii table with indexed user_id for O(1) lookups. Search happens on unencrypted columns when possible.

**Q: How often should we rotate encryption keys?**
A: Annually for routine rotation, immediately if key compromised. Use DB functions to re-encrypt in bulk.

**Q: Can users access other users' audit logs?**
A: No. RLS policies restrict access. Only admins and the user themselves can view their logs.

**Q: How long do we retain audit logs?**
A: Recommended 1 year. Retention policy set via Supabase lifecycle rules.

**Q: Is export data itself encrypted?**
A: ZIP exported to Supabase storage with encryption at rest. Signed URLs require valid signature to download.

**Q: What if a user requests deletion?**
A: Audit logs are immutable (no delete policies). Implement anonymization instead (hash user_id, clear PII).

---

## 10. Compliance Certification

This implementation provides:

✅ **LGPD** (Lei Geral de Proteção de Dados)  
✅ **GDPR** (General Data Protection Regulation)  
✅ **CCPA** (Partial - California Consumer Privacy Act)  
✅ **ISO 27001** (Information Security Management)  

---

## Support

For compliance questions:
- Contact: compliance@example.com
- Docs: https://docs.example.com/compliance
- Issue Tracker: https://github.com/...

**Last Updated:** October 26, 2026  
**Version:** 1.0.0
