# LGPD/GDPR Implementation Guide

## Quick Start

### 1. Database Setup (5 min)

```bash
# 1. Open Supabase Dashboard
# 2. Go to SQL Editor
# 3. Copy schema migration from: schema-migrations/001-lgpd-gdpr-compliance.sql
# 4. Execute
# 5. Verify tables created:
#    - audit_logs ✓
#    - user_consents ✓
#    - encrypted_pii ✓
#    - gdpr_requests ✓
```

### 2. Environment Setup (5 min)

```bash
# Generate encryption key
openssl rand -base64 32
# Example: 7d5A3kL9mB2cQ6wE8xY1vU3hJ4tN5sR7pO9mK2lQ8vW6xZ=

# Add to .env.local (enem-pro)
echo 'PII_ENCRYPTION_KEY=7d5A3kL9mB2cQ6wE8xY1vU3hJ4tN5sR7pO9mK2lQ8vW6xZ=' >> .env.local

# Verify extension enabled
psql -U postgres -h localhost -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

### 3. enem-pro Integration (10 min)

#### A. Add dependencies (if needed)
```bash
npm install jszip uuid
```

#### B. Use audit logger in handlers
```typescript
import { auditLog } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  // ... your handler ...

  // Log action
  await auditLog.log({
    userId: user.id,
    email: user.email,
    action: 'UPDATE_PROFILE',
    resource: 'users',
    changes: { name: { old: oldName, new: newName } },
    ip: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
  });

  // ... return response ...
}
```

#### C. Use consent manager
```typescript
import { consentManager } from '@/lib/consent-manager';

// After user login
await consentManager.setUserId(user.id);

// Check before tracking
if (await consentManager.hasConsent(user.id, 'analytics')) {
  // Send to Google Analytics
}

// Show banner if needed
if (consentManager.shouldShowBanner()) {
  // Display consent banner
}
```

#### D. Use encryption for PII
```typescript
import { encryptionUtils } from '@/lib/encryption-utils';

// When storing email
await encryptionUtils.storeEncryptedPII(userId, 'email', email);

// When retrieving email
const email = await encryptionUtils.getEncryptedPII(userId, 'email');

// When logging (always mask)
const maskedEmail = encryptionUtils.maskPII(email, 'email');
await auditLog.log({
  email: maskedEmail,
  // ...
});
```

### 4. clube-da-escolha Integration (10 min)

#### A. Use audit logger (SPA version)
```typescript
import { auditLogger } from '@/lib/audit-logger';

// After user logs in
auditLogger.setUserId(user.id);

// Log actions
await auditLogger.log({
  userId: user.id,
  email: user.email,
  action: 'VIEW_AFFILIATE_LINK',
  resource: 'affiliates',
  metadata: { affiliateId: 'aff_123' }
});

// Data is queued and flushed every 5 seconds
```

#### B. Use consent manager
```typescript
import { consentManager } from '@/lib/consent-manager';

// After login
consentManager.setUserId(user.id);
await consentManager.loadFromBackend();

// Show consent banner
if (consentManager.shouldShowBanner()) {
  // Display UI
}

// When user grants/revokes consent
await consentManager.setConsent('marketing', true);
```

#### C. Add GDPR export UI
```typescript
// In a component
async function handleExportClick() {
  const response = await fetch('/api/export-my-data', {
    method: 'POST',
    body: JSON.stringify({ email: userEmail })
  });

  const data = await response.json();
  if (data.downloadUrl) {
    window.open(data.downloadUrl);
  }
}
```

---

## Integration Points

### API Endpoints

#### enem-pro (Next.js)
```
POST   /api/export-my-data          → Export user data
GET    /api/admin/audit-logs        → View audit logs (admin)
GET    /api/consent/status          → Get user consents
POST   /api/consent/set             → Set user consent
```

#### clube-da-escolha (Vite)
```
POST   /api/export-my-data.js       → Export user data
GET    /api/audit-logs.js           → View audit logs (admin)
```

### Database Tables

| Table | Purpose | Rows |
|-------|---------|------|
| `audit_logs` | Complete action history | Grows daily |
| `user_consents` | Consent change history | 5 per user per change |
| `encrypted_pii` | Encrypted personal data | 1 per user per field |
| `gdpr_requests` | GDPR data requests | Grows monthly |

### Storage Buckets

| Bucket | Purpose | Public |
|--------|---------|--------|
| `gdpr-exports` | User data exports (ZIP/JSON) | No |

---

## Testing

### Unit Tests
```bash
npm test -- compliance.test.ts
```

### Integration Test (GDPR Export)
```bash
# 1. Register test user
POST /auth/register
{ email: "test@example.com", password: "..." }

# 2. Request export
POST /api/export-my-data
{ email: "test@example.com" }

# 3. Download and verify
# Check ZIP contains: profile.json, audit-trail.json, consents.json
```

### Admin Audit Logs
```bash
# Get token from admin login
curl "http://localhost:3000/api/admin/audit-logs?limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Deployment Checklist

- [ ] Schema migration executed on production
- [ ] Encryption key set in production env
- [ ] GDPR export endpoint deployed
- [ ] Audit logger integrated in 2+ projects
- [ ] Consent manager UI added
- [ ] RLS policies verified
- [ ] Storage bucket created (gdpr-exports)
- [ ] Logs monitored for errors
- [ ] Backup procedure documented
- [ ] Team trained on compliance

---

## Monitoring

### Key Metrics to Track

1. **Audit Log Volume**
   ```sql
   SELECT DATE(created_at), COUNT(*) 
   FROM audit_logs
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```

2. **Consent Distribution**
   ```sql
   SELECT consent_type, granted, COUNT(*)
   FROM user_consents
   GROUP BY consent_type, granted;
   ```

3. **GDPR Requests**
   ```sql
   SELECT request_type, status, COUNT(*)
   FROM gdpr_requests
   GROUP BY request_type, status;
   ```

4. **Encryption Errors**
   - Monitor logs for "Encryption error" or "Decryption error"
   - Alert if error rate > 1%

### Alerts to Set Up

- ⚠️ High audit log volume (>100k/day)
- ⚠️ Encryption failures
- ⚠️ GDPR export failures
- ⚠️ Storage bucket near quota (>80%)

---

## Troubleshooting

### Q: Encryption key not found
**A:** Check `.env.local` has `PII_ENCRYPTION_KEY` set
```bash
echo $PII_ENCRYPTION_KEY
```

### Q: Decrypt returns empty string
**A:** 
1. Check encryption key is same
2. Verify pgcrypto extension enabled
3. Check value is actually encrypted (BYTEA type)

### Q: Audit logs not appearing
**A:**
1. Check `audit_logs` table exists
2. Verify Supabase service role key is set
3. Check RLS policies allow inserts

### Q: GDPR export endpoint 500 error
**A:**
1. Check `gdpr-exports` storage bucket exists
2. Verify service role has bucket permissions
3. Check error logs in Supabase

### Q: Consent banner shows multiple times
**A:**
- Clear browser localStorage
- Check `shouldShowBanner()` logic
- Verify consent saved to database

---

## Security Best Practices

1. **Never commit encryption keys**
   ```bash
   # .env.local is in .gitignore
   grep PII_ENCRYPTION_KEY .gitignore
   ```

2. **Rotate keys annually**
   - Document in CHANGELOG
   - Test in staging first
   - Provide rollback plan

3. **Monitor PII access**
   ```sql
   SELECT * FROM audit_logs
   WHERE action LIKE '%PII%'
   ORDER BY created_at DESC;
   ```

4. **Restrict admin access**
   - Only super-admins can view audit logs
   - Require 2FA for admin endpoints
   - Log all admin activity

5. **Backup encryption keys**
   - Store in password manager
   - Store in hardware key (YubiKey)
   - Document recovery procedure

---

## Compliance Verification

### LGPD Checklist
- [ ] Art. 6: Lawful basis tracked (consents)
- [ ] Art. 9: Sensitive data protected (encryption)
- [ ] Art. 18: Right of access (export endpoint)
- [ ] Art. 19: Right to correction (audit trail)
- [ ] Art. 20: Right to deletion (scheduled)
- [ ] Art. 21: Right to opt-out (consent revoke)
- [ ] Art. 32: Security measures (encryption + audit)

### GDPR Checklist
- [ ] Privacy by design
- [ ] Data minimization
- [ ] Purpose limitation
- [ ] Consent management
- [ ] Right to access
- [ ] Right to erasure
- [ ] Right to rectification
- [ ] Data portability

---

## Additional Resources

- 📖 [LGPD-GDPR.md](./docs/LGPD-GDPR.md) - Full documentation
- 📖 [encryption-strategy.md](./docs/encryption-strategy.md) - Encryption details
- 🗄️ [SQL Schema](./schema-migrations/001-lgpd-gdpr-compliance.sql) - Database setup
- 🧪 [Tests](../__tests__/lib/compliance.test.ts) - Test examples
- 📝 [Audit Logger](./lib/audit-logger.ts) - Implementation
- 📝 [Consent Manager](./lib/consent-manager.ts) - Implementation
- 📝 [Encryption Utils](./lib/encryption-utils.ts) - Implementation

---

**Last Updated:** October 26, 2026  
**Status:** Production Ready  
**Version:** 1.0.0
