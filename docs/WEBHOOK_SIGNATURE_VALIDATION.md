# Webhook Signature Validation — enem-pro

**Status:** ✅ Implemented  
**Location:** `lib/webhook-verify.ts`  
**Endpoints:** `/api/webhook` (Stripe), `/api/webhooks/anthropic` (Anthropic)  
**Last Updated:** 2026-10-26

---

## Overview

This implementation provides production-grade webhook signature validation for both **Stripe** and **Anthropic**, protecting against:

- **Spoofed webhooks** — Attackers cannot forge valid signatures without the secret key
- **Timestamp attacks** — Replay attacks are blocked by enforcing a 5-minute window (Stripe)
- **Timing attacks** — Signature comparison uses `timingSafeEqual` to prevent side-channel attacks
- **Tampered payloads** — Any modification to the request body invalidates the signature

---

## Architecture

### Stripe Webhook Verification

**Method:** HMAC SHA-256 with timestamp + signature header

**Headers:**
```
stripe-signature: t=<timestamp>,v1=<signature>[,v0=<legacy>]
```

**Flow:**
1. Extract timestamp (`t`) and signature (`v1`) from header
2. Verify timestamp is within 5 minutes of current time
3. Reconstruct signed content: `${timestamp}.${raw_body}`
4. Compute HMAC SHA-256 using `STRIPE_WEBHOOK_SECRET`
5. Compare using timing-safe comparison

**Environment Variable:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_live_...  # From Stripe Dashboard → Webhooks
```

### Anthropic Webhook Verification

**Method:** Bearer token in Authorization header

**Headers:**
```
Authorization: Bearer <webhook_token>
```

**Flow:**
1. Extract token from `Authorization: Bearer <token>` header
2. Compare token against `ANTHROPIC_WEBHOOK_TOKEN` using timing-safe comparison
3. Reject if header format is invalid or token mismatches

**Environment Variable:**
```bash
ANTHROPIC_WEBHOOK_TOKEN=webhook_token_...  # Custom token (NOT the API key)
```

### Logging & Audit Trail

Every webhook verification is logged with:
- **timestamp** — ISO 8601 format
- **provider** — `stripe` or `anthropic`
- **signature** — Hashed for audit (first 16 chars of SHA-256) — never logs raw secret
- **result** — `success` or `failure`
- **reason** — Error message if failed (e.g., "Signature mismatch", "Timestamp outside 5-minute window")
- **ip_address** — Source IP for suspicious activity tracking

**Logs go to:**
- **Development:** Pretty-printed to stdout (pino with color)
- **Production:** JSON to stdout (for log aggregation services)

Example log entry:
```json
{
  "level": 30,
  "time": "2026-10-26T14:32:15.123Z",
  "requestId": "req_abc123def456",
  "event": "webhook_stripe",
  "provider": "stripe",
  "result": "success",
  "timestamp": "2026-10-26T14:32:12.000Z",
  "signature_hash": "a7b8c9d0e1f2g3h4",
  "ip_address": "192.0.2.1"
}
```

---

## API Endpoints

### POST /api/webhook (Stripe)

**Protection Level:** ✅ Signature-verified  
**Signature Method:** HMAC SHA-256  
**Events Handled:**
- `checkout.session.completed` — User subscription activated
- `customer.subscription.updated` — Subscription plan changed or expired
- `customer.subscription.deleted` — Subscription cancelled

**cURL Example - Valid Webhook (Signed):**
```bash
# Generate timestamp and signature locally
TIMESTAMP=$(date +%s)
BODY='{"id":"evt_test_123","type":"checkout.session.completed","data":{"object":{"id":"cs_test"}}}'
SECRET="whsec_test_....."

# Compute signature
SIGNED_CONTENT="${TIMESTAMP}.${BODY}"
SIGNATURE=$(echo -n "$SIGNED_CONTENT" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# Send webhook
curl -X POST https://enem-pro.com/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=${TIMESTAMP},v1=${SIGNATURE}" \
  -d "$BODY"

# Expected response: { "ok": true }
```

**cURL Example - Unsigned/Forged Webhook (Rejected):**
```bash
# Without valid signature → 401 Unauthorized
curl -X POST https://enem-pro.com/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000" \
  -d '{"id":"evt_fake","type":"checkout.session.completed","data":{"object":{"id":"cs_fake"}}}'

# Expected response: HTTP 401 { "error": "Webhook signature verification failed" }
```

---

### POST /api/webhooks/anthropic (Anthropic)

**Protection Level:** ✅ Bearer token-verified  
**Signature Method:** Bearer token in Authorization header  
**Events Handled:**
- `message.completed` — Individual message generation completed
- `batch.completed` — Batch processing job completed
- `usage.updated` — Token usage updated

**cURL Example - Valid Webhook (Signed):**
```bash
TOKEN="webhook_token_abc123xyz"

curl -X POST https://enem-pro.com/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "message.completed",
    "created_at": "2026-10-26T14:32:15Z",
    "data": {
      "id": "msg_test_123",
      "role": "assistant",
      "content": "..."
    }
  }'

# Expected response: { "ok": true }
```

**cURL Example - Unsigned/Invalid Token (Rejected):**
```bash
# Without Authorization header → 401 Unauthorized
curl -X POST https://enem-pro.com/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -d '{"type":"message.completed","data":{}}'

# Expected response: HTTP 401 { "error": "Webhook signature verification failed" }

# With wrong token → 401 Unauthorized
curl -X POST https://enem-pro.com/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_token_xyz" \
  -d '{"type":"message.completed","data":{}}'

# Expected response: HTTP 401 { "error": "Webhook signature verification failed" }
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Stripe Webhook Secret
# Found at: Stripe Dashboard → Developers → Webhooks → [Your Endpoint] → Signing Secret
STRIPE_WEBHOOK_SECRET=whsec_test_abc123...

# Anthropic Webhook Token
# Custom token (NOT your API key). Set in Anthropic's webhook configuration
ANTHROPIC_WEBHOOK_TOKEN=webhook_token_def456...
```

### Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Click **Developers** → **Webhooks**
3. Click **Add endpoint** and enter:
   - **Endpoint URL:** `https://enem-pro.com/api/webhook`
   - **Events:** Select:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
4. Click **Add endpoint**
5. Click the endpoint to see **Signing secret** (`whsec_...`)
6. Copy and set as `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Anthropic Configuration

1. Contact Anthropic or use their dashboard (if available)
2. Generate a custom webhook token (e.g., `webhook_token_xyz123`)
3. Set your webhook endpoint: `https://enem-pro.com/api/webhooks/anthropic`
4. Set the Authorization header: `Bearer webhook_token_xyz123`
5. Add token to `.env.local` as `ANTHROPIC_WEBHOOK_TOKEN`

---

## Testing

### Unit Tests

Run tests for signature verification:

```bash
npm run test lib/__tests__/webhook-verify.test.ts
```

**Test Coverage:**
- ✅ Valid Stripe signatures accepted
- ✅ Invalid/forged signatures rejected with 401
- ✅ Tampered request bodies detected
- ✅ Timestamp validation (5-minute window)
- ✅ Valid Anthropic tokens accepted
- ✅ Invalid/wrong tokens rejected with 401
- ✅ Bearer token format validation
- ✅ Timing-safe comparison prevents side-channel attacks
- ✅ No secrets leaked in error messages
- ✅ Large payloads handled correctly

### Integration Tests (Manual)

**Test 1: Stripe Valid Signature**

```bash
#!/bin/bash
TIMESTAMP=$(date +%s)
BODY='{"id":"evt_test_12345","type":"checkout.session.completed","data":{"object":{"customer":"cus_test","subscription":"sub_test"}}}'
SECRET="${STRIPE_WEBHOOK_SECRET}"  # From .env.local

SIGNED_CONTENT="${TIMESTAMP}.${BODY}"
SIGNATURE=$(echo -n "$SIGNED_CONTENT" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=${TIMESTAMP},v1=${SIGNATURE}" \
  -d "$BODY"

# Expected: HTTP 200 { "ok": true }
# Logs should show: webhook_stripe result=success
```

**Test 2: Stripe Forged Signature (Should Reject)**

```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000" \
  -d '{"id":"evt_fake","type":"checkout.session.completed","data":{"object":{}}}'

# Expected: HTTP 401 { "error": "Webhook signature verification failed" }
# Logs should show: webhook_stripe result=failure reason="Signature mismatch"
```

**Test 3: Anthropic Valid Token**

```bash
TOKEN="${ANTHROPIC_WEBHOOK_TOKEN}"  # From .env.local

curl -X POST http://localhost:3000/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "type": "message.completed",
    "created_at": "2026-10-26T14:32:15Z",
    "data": {"id": "msg_test_123", "role": "assistant"}
  }'

# Expected: HTTP 200 { "ok": true }
# Logs should show: webhook_anthropic result=success
```

**Test 4: Anthropic Invalid Token (Should Reject)**

```bash
curl -X POST http://localhost:3000/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_token_xyz" \
  -d '{"type":"message.completed","data":{"id":"msg_test_123"}}'

# Expected: HTTP 401 { "error": "Webhook signature verification failed" }
# Logs should show: webhook_anthropic result=failure reason="Token mismatch"
```

**Test 5: Missing Authorization (Should Reject)**

```bash
curl -X POST http://localhost:3000/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -d '{"type":"message.completed","data":{"id":"msg_test_123"}}'

# Expected: HTTP 401 { "error": "Webhook signature verification failed" }
# Logs should show: webhook_anthropic result=failure reason="Missing Authorization header"
```

---

## Source Code

### Core Module: `lib/webhook-verify.ts`

**Exported Functions:**

```typescript
// Verify Stripe signature
export function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): WebhookVerificationResult

// Verify Anthropic signature
export function verifyAnthropicSignature(
  authHeader: string,
  secret: string
): WebhookVerificationResult

// Middleware for Stripe in route handlers
export async function verifyStripeWebhook(
  request: NextRequest,
  logger: Logger,
  context: LogContext
): Promise<{ valid: boolean; response?: NextResponse; body?: string }>

// Middleware for Anthropic in route handlers
export async function verifyAnthropicWebhook(
  request: NextRequest,
  logger: Logger,
  context: LogContext
): Promise<{ valid: boolean; response?: NextResponse; body?: string }>

// Log webhook verification events
export function logWebhookEvent(
  logger: Logger,
  entry: WebhookLogEntry
): void
```

### Updated Route Handlers

**`app/api/webhook/route.ts`** (Stripe)
- Added: `verifyStripeWebhook()` call before processing
- Returns 401 if signature invalid
- Logs all verification results

**`app/api/webhooks/anthropic/route.ts`** (Anthropic)
- Added: `verifyAnthropicWebhook()` call before processing
- Returns 401 if token invalid
- Logs all verification results

---

## Security Considerations

### ✅ Implemented Protections

1. **Timing-Safe Comparison** — Uses Node.js `timingSafeEqual()` to prevent timing attacks
2. **Timestamp Validation** — Stripe webhooks must be within 5 minutes (prevents replay attacks)
3. **Secret Hashing in Logs** — Never logs raw signatures/tokens; hashes them for audit trail
4. **IP Tracking** — Logs source IP for suspicious activity investigation
5. **Error Message Safety** — Error messages never leak secret values
6. **HMAC Integrity** — Body tampering is immediately detected

### ⚠️ Known Limitations

1. **Signature Logging** — Currently logs to stdout only. For long-term audit trails, consider:
   - PostgreSQL webhook_logs table
   - Third-party log aggregation (Datadog, Sentry, LogRocket)
   - AWS CloudWatch / Google Cloud Logging

2. **Rate Limiting** — No built-in rate limiting on webhook endpoints. Recommended:
   - Add `lib/rate-limit.ts` middleware
   - Configure Stripe to retry on 429 (Stripe does this by default)
   - Set per-IP request limits

3. **Webhook Replay Detection** — Timestamp validation prevents old replays, but for additional protection:
   - Store processed webhook IDs in Redis (ttl: 24h)
   - Reject duplicate event IDs

### ⚠️ Secrets Management

**DO NOT:**
- Commit `STRIPE_WEBHOOK_SECRET` or `ANTHROPIC_WEBHOOK_TOKEN` to git
- Log raw webhook signatures or tokens
- Share secrets in error messages or Slack alerts

**DO:**
- Store secrets in `.env.local` (git-ignored)
- Store secrets in production as environment variables
- Use `process.env.STRIPE_WEBHOOK_SECRET` (loaded at runtime)
- Rotate secrets periodically (especially if exposed)

---

## Troubleshooting

### "Webhook signature verification failed" (401)

**Stripe:**

1. **Check signing secret is correct**
   ```bash
   # In .env.local, verify:
   STRIPE_WEBHOOK_SECRET=whsec_live_...  # NOT whsec_test_...
   ```

2. **Verify timestamp is recent**
   - Stripe rejects signatures outside 5-minute window
   - Check server clock is synchronized (use `ntpd`)

3. **Confirm body is raw (not parsed)**
   - Body must be sent as raw string, not JSON-parsed then re-stringified
   - Whitespace differences will break the signature

4. **Check Stripe endpoint configuration**
   - Verify webhook is pointing to correct URL
   - Check API version matches (Stripe can version webhooks)

**Anthropic:**

1. **Check token is correct**
   ```bash
   # In .env.local, verify:
   ANTHROPIC_WEBHOOK_TOKEN=webhook_token_...  # NOT API key
   ```

2. **Verify Authorization header format**
   ```bash
   # Correct:
   Authorization: Bearer webhook_token_xyz
   
   # Incorrect:
   Authorization: webhook_token_xyz
   Authorization: ApiKey webhook_token_xyz
   ```

3. **Check for whitespace issues**
   - `Authorization: Bearer  token` (extra space) works
   - `Authorization: Bearer token\n` (trailing newline) will fail

### Webhook events not being processed

**Check logs:**
```bash
# Verify webhook was received and verified
tail -f .logs/app.log | grep webhook_stripe
tail -f .logs/app.log | grep webhook_anthropic

# Look for:
# - "result": "success" — webhook verified and processed
# - "result": "failure" — webhook rejected (check "reason")
```

### Signature mismatch for valid webhooks

**Common issues:**

1. **Request body was parsed then re-stringified**
   - JSON parsing changes whitespace
   - Always use raw body: `await request.text()` not `await request.json()`

2. **Different STRIPE_WEBHOOK_SECRET in different environments**
   - Development: `whsec_test_...`
   - Production: `whsec_live_...`
   - Verify correct secret is in each environment

3. **Stripe re-signing webhooks**
   - Stripe signs events again when retrying
   - Each retry has new timestamp and signature
   - This is correct behavior

---

## Examples

### Python: Generate Stripe Signature for Testing

```python
import hmac
import hashlib
import time
import json

SECRET = "whsec_test_abc123"
BODY = json.dumps({"id": "evt_123", "type": "checkout.session.completed", "data": {}})
TIMESTAMP = str(int(time.time()))

signed_content = f"{TIMESTAMP}.{BODY}"
signature = hmac.new(
    SECRET.encode(),
    signed_content.encode(),
    hashlib.sha256
).hexdigest()

print(f"t={TIMESTAMP},v1={signature}")
```

### JavaScript: Generate Stripe Signature

```javascript
const crypto = require('crypto');

const secret = 'whsec_test_abc123';
const body = JSON.stringify({ id: 'evt_123', type: 'checkout.session.completed', data: {} });
const timestamp = Math.floor(Date.now() / 1000).toString();

const signedContent = `${timestamp}.${body}`;
const signature = crypto
  .createHmac('sha256', secret)
  .update(signedContent)
  .digest('hex');

console.log(`t=${timestamp},v1=${signature}`);
```

### Node.js: Send Anthropic Webhook Locally

```javascript
const https = require('https');

const token = 'webhook_token_xyz123';
const body = JSON.stringify({
  type: 'message.completed',
  created_at: new Date().toISOString(),
  data: { id: 'msg_123' }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/anthropic',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Authorization': `Bearer ${token}`
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (d) => process.stdout.write(d));
});

req.on('error', (e) => console.error(e));
req.write(body);
req.end();
```

---

## Files Changed

✅ **Created:**
- `lib/webhook-verify.ts` — Core verification library
- `app/api/webhooks/anthropic/route.ts` — Anthropic webhook endpoint
- `lib/__tests__/webhook-verify.test.ts` — Comprehensive test suite

✅ **Updated:**
- `app/api/webhook/route.ts` — Added signature verification to Stripe endpoint
- `.env.example` — Updated with webhook secrets

---

## Next Steps

1. **Add to .env.local:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   ANTHROPIC_WEBHOOK_TOKEN=webhook_token_...
   ```

2. **Run tests:**
   ```bash
   npm run test lib/__tests__/webhook-verify.test.ts
   ```

3. **Configure Stripe webhook:**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://enem-pro.com/api/webhook`
   - Copy signing secret to `.env.local`

4. **Test locally:**
   ```bash
   npm run dev
   # Then run the manual integration tests above
   ```

5. **Monitor in production:**
   - Check logs for webhook verification results
   - Alert if `result=failure` spikes
   - Investigate any `ip_address` anomalies

---

## References

- [Stripe Webhook Signing](https://stripe.com/docs/webhooks/signatures)
- [Node.js timingSafeEqual](https://nodejs.org/api/crypto.html#crypto_crypto_timingsafeequal_a_b)
- [OWASP Timing Attacks](https://owasp.org/www-community/attacks/Timing_attack)
- [Cryptographic Hashing](https://en.wikipedia.org/wiki/Cryptographic_hash_function)
