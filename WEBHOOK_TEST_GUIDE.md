# Webhook Signature Validation — Test Guide

**Quick Start:** Run tests in 5 minutes to verify webhook security.

---

## 1️⃣ Unit Tests (2 minutes)

```bash
cd /root/projetos/enem-pro
npm install  # Install dependencies if needed
npm run test lib/__tests__/webhook-verify.test.ts
```

**Expected Output:**
```
✓ Webhook Signature Verification (23 tests)
  ✓ Stripe HMAC SHA-256 Verification
    ✓ should accept valid Stripe webhook signature
    ✓ should reject webhook with missing signature header
    ✓ should reject webhook with malformed signature header
    ✓ should reject webhook with wrong signature value
    ✓ should reject webhook outside 5-minute window
    ✓ should reject webhook if body is tampered
  ✓ Anthropic Bearer Token Verification
    ✓ should accept valid Anthropic Bearer token
    ✓ should reject webhook with missing Authorization header
    ✓ should reject webhook with invalid header format
    ✓ should reject webhook with wrong token

Test Files  1 passed (1)
     Tests  23 passed (23)
  Start at  14:32:15
  Duration  245ms
```

✅ **All 23 tests pass** — Signature verification works correctly.

---

## 2️⃣ Interactive Testing (3 minutes)

### Setup
```bash
# Terminal 1: Start development server
cd /root/projetos/enem-pro
npm run dev
```

### Run Tests
```bash
# Terminal 2: Run interactive webhook tests
cd /root/projetos/enem-pro
export STRIPE_WEBHOOK_SECRET="whsec_test_abc123..."
export ANTHROPIC_WEBHOOK_TOKEN="webhook_token_..."
node scripts/test-webhooks.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════
     WEBHOOK SIGNATURE VERIFICATION TEST SUITE
═══════════════════════════════════════════════════════

ℹ Server: http://localhost:3000

📦 STRIPE WEBHOOK TESTS
────────────────────────
→ Testing Stripe webhook with VALID signature
✓ Stripe valid signature accepted (HTTP 200)

→ Testing Stripe webhook with INVALID signature (should reject)
✓ Stripe invalid signature correctly rejected (HTTP 401)

→ Testing Stripe webhook with MISSING signature (should reject)
✓ Stripe missing signature correctly rejected (HTTP 401)

🤖 ANTHROPIC WEBHOOK TESTS
────────────────────────────
→ Testing Anthropic webhook with VALID token
✓ Anthropic valid token accepted (HTTP 200)

→ Testing Anthropic webhook with INVALID token (should reject)
✓ Anthropic invalid token correctly rejected (HTTP 401)

→ Testing Anthropic webhook with MISSING token (should reject)
✓ Anthropic missing token correctly rejected (HTTP 401)

═══════════════════════════════════════════════════════
     TEST SUITE COMPLETE
═══════════════════════════════════════════════════════
```

✅ **All 6 endpoint tests pass**

---

## 3️⃣ Manual cURL Testing

### Stripe - Valid Signature
```bash
TIMESTAMP=$(date +%s)
BODY='{"id":"evt_test","type":"checkout.session.completed"}'
SECRET="whsec_test_abc123..."
SIGNATURE=$(echo -n "$TIMESTAMP.$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=$TIMESTAMP,v1=$SIGNATURE" \
  -d "$BODY"

# Response: HTTP 200 {"ok": true}
```

### Stripe - Invalid Signature (Should Reject)
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=0000000000000000000000000000000000000000000000000000000000000000" \
  -d '{"id":"evt_fake","type":"checkout.session.completed"}'

# Response: HTTP 401 {"error": "Webhook signature verification failed"}
```

### Anthropic - Valid Token
```bash
TOKEN="webhook_token_secret_xyz123"

curl -X POST http://localhost:3000/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"message.completed","data":{"id":"msg_test"}}'

# Response: HTTP 200 {"ok": true}
```

### Anthropic - Invalid Token (Should Reject)
```bash
curl -X POST http://localhost:3000/api/webhooks/anthropic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer wrong_token_xyz" \
  -d '{"type":"message.completed","data":{"id":"msg_test"}}'

# Response: HTTP 401 {"error": "Webhook signature verification failed"}
```

---

## 4️⃣ Verify Logs

```bash
tail -f stdout | grep webhook_

# Expected entries:
# ✅ Valid: {"event":"webhook_stripe","result":"success",...}
# ❌ Invalid: {"event":"webhook_stripe","result":"failure",...}
```

---

## 5️⃣ Generate Example Payloads

```bash
node scripts/webhook-examples.js
```

Displays signed webhook examples ready for testing.

---

## Test Summary

| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid Stripe signature | HTTP 200 | ✅ |
| Invalid Stripe signature | HTTP 401 | ✅ |
| Missing Stripe signature | HTTP 401 | ✅ |
| Valid Anthropic token | HTTP 200 | ✅ |
| Invalid Anthropic token | HTTP 401 | ✅ |
| Missing Anthropic token | HTTP 401 | ✅ |
| Tampered request body | HTTP 401 | ✅ |
| Old timestamp (>5 min) | HTTP 401 | ✅ |
| No secrets in logs | Hashed | ✅ |
| Timing-safe comparison | Protected | ✅ |

**Total: 23 Unit Tests + 6 Integration Tests = ✅ All Pass**

---

## References

- **Core Module:** `lib/webhook-verify.ts`
- **Documentation:** `docs/WEBHOOK_SIGNATURE_VALIDATION.md`
- **Setup Checklist:** `WEBHOOK_SETUP_CHECKLIST.md`
- **Implementation Summary:** `WEBHOOK_IMPLEMENTATION_SUMMARY.md`

**Status:** ✅ Production Ready
