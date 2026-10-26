# Admin 2FA + IP Whitelist Implementation

## Overview

This implementation adds **TOTP-based 2FA** + **IP whitelist** authentication to 3 admin endpoints in enem-pro:
- `GET /api/admin/stats` — Fetch dashboard statistics
- `POST /api/admin/upgrade` — Upgrade user to PRO plan
- `POST /api/admin/warm-cache` — Warm cache for all ENEM years

### Security Layers
1. **IP Whitelist**: Request IP must be in `ADMIN_IPS` environment variable
2. **TOTP (Time-based One-Time Password)**: 6-digit code from authenticator app + secret stored in `ADMIN_TOTP_SECRET`

---

## Setup

### 1. Environment Configuration

Add these variables to your `.env.local` or deployment environment:

```bash
# IP whitelist (comma-separated, supports exact IPs, CIDR /24, wildcards)
ADMIN_IPS=127.0.0.1,192.168.1.0/24,10.*

# TOTP secret (generated during setup, base32-encoded)
ADMIN_TOTP_SECRET=JBSWY3DPEBLW64TMMQ======

# Setup token (one-time use, for /api/admin/2fa-setup endpoint)
ADMIN_SETUP_TOKEN=your-secure-random-token-here
```

### 2. Generate TOTP Secret & QR Code

Call the setup endpoint **once** to generate the secret and QR code:

```bash
curl -X POST http://localhost:3000/api/admin/2fa-setup \
  -H "x-setup-token: your-secure-random-token-here" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9r...",
  "recoveryCode": "ABC123XYZ789",
  "instructions": {
    "step1": "Save the recovery code in a secure location",
    "step2": "Scan the QR code with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator)",
    "step3": "Or manually enter the secret key into your authenticator app",
    "step4": "Set ADMIN_TOTP_SECRET to the secret value in your environment",
    "step5": "Include x-admin-totp header with 6-digit code in admin requests"
  }
}
```

### 3. Setup Authenticator App

**Option A: Scan QR Code**
1. Open Google Authenticator, Authy, or Microsoft Authenticator
2. Tap the "+" button to add new account
3. Select "Scan QR code"
4. Scan the QR code from the setup response
5. The app will now generate 6-digit codes that refresh every 30 seconds

**Option B: Manual Entry**
1. In your authenticator app, select "Enter a setup key"
2. Input the secret: `JBSWY3DPEBLW64TMMQ======`
3. Set name to "ENEM-Pro Admin"
4. Set type to "Time-based"

### 4. Deploy Configuration

Update your deployment environment:

```bash
# Vercel
vercel env add ADMIN_IPS "127.0.0.1,192.168.1.0/24"
vercel env add ADMIN_TOTP_SECRET "JBSWY3DPEBLW64TMMQ======"
vercel env add ADMIN_SETUP_TOKEN "your-setup-token"
vercel deploy --prod
```

---

## Usage

### Making Authenticated Admin Requests

```bash
# Get current 6-digit code from your authenticator app (e.g., 123456)
TOTP_CODE="123456"

# Request stats endpoint
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-totp: $TOTP_CODE"

# Request upgrade endpoint
curl -X POST http://localhost:3000/api/admin/upgrade \
  -H "x-admin-totp: $TOTP_CODE" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","months":3}'

# Request warm-cache endpoint
curl -X POST http://localhost:3000/api/admin/warm-cache \
  -H "x-admin-totp: $TOTP_CODE"
```

### IP Address Handling

The middleware automatically detects your IP from request headers (in order):
1. `x-forwarded-for` (proxy header)
2. `x-real-ip` (nginx reverse proxy)
3. `cf-connecting-ip` (Cloudflare)
4. Socket address (if no proxy headers)

You can optionally override with:
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-totp: 123456" \
  -H "x-admin-ip: 192.168.1.100"
```

---

## Test Cases

### Test 1: IP Block (Unauthorized IP)

```bash
# Simulate request from blocked IP
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-ip: 10.0.0.1" \
  -H "x-admin-totp: 123456"
```

**Expected Response (401)**:
```json
{
  "error": "IP 10.0.0.1 is not whitelisted"
}
```

**Server Log**:
```
[admin-auth] IP blocked: 10.0.0.1
```

---

### Test 2: TOTP Fail (Invalid Token)

```bash
# Valid IP, but wrong TOTP code
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-totp: 000000"
```

**Expected Response (401)**:
```json
{
  "error": "Invalid TOTP token"
}
```

**Server Log**:
```
[admin-auth] Invalid TOTP from IP: 127.0.0.1
```

---

### Test 3: TOTP Success (Valid Token)

```bash
# Valid IP + valid 6-digit code from authenticator
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-totp: 123456"
```

**Expected Response (200)**:
```json
{
  "users": { "total": 1250, "new_week": 45 },
  "answers": { "total": 45000, "today": 892 },
  "pro": { "active": 312 },
  "emails_sent": 2048,
  "cache_last": "2026-10-26T19:45:00Z",
  "paywallHitsToday": 234,
  "aiUsageRate": "28%",
  "conversionRate": "25%"
}
```

**Server Log**:
```
[admin-auth] Authorized: 127.0.0.1
```

---

## Protected Endpoints

### 1. `/api/admin/stats` (GET)

**Protections**: ✅ IP Whitelist + TOTP

Fetch dashboard statistics (users, answers, pro conversion, cache status).

```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "x-admin-totp: 123456"
```

---

### 2. `/api/admin/upgrade` (POST)

**Protections**: ✅ IP Whitelist + TOTP + Request Body Validation

Upgrade user to PRO plan.

```bash
curl -X POST http://localhost:3000/api/admin/upgrade \
  -H "x-admin-totp: 123456" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","months":3}'
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "months": 3
}
```

**Response (200)**:
```json
{
  "ok": true,
  "user_id": "uuid-123",
  "expires_at": "2027-01-26T00:00:00Z"
}
```

---

### 3. `/api/admin/warm-cache` (POST)

**Protections**: ✅ IP Whitelist + TOTP + Long Timeout (300s)

Pre-warm cache for all ENEM years (2009-2023).

```bash
curl -X POST http://localhost:3000/api/admin/warm-cache \
  -H "x-admin-totp: 123456"
```

**Response (200)**:
```json
{
  "warmed": {
    "2023": "ok (180 questões)",
    "2022": "ok (180 questões)",
    "2021": "ok (180 questões)",
    "2020": "ok (180 questões)",
    "2019": "ok (180 questões)",
    "2018": "ok (180 questões)",
    "2017": "ok (180 questões)",
    "2016": "ok (180 questões)",
    "2015": "ok (180 questões)",
    "2014": "ok (180 questões)",
    "2013": "ok (180 questões)",
    "2012": "ok (180 questões)",
    "2011": "ok (180 questões)",
    "2010": "ok (180 questões)",
    "2009": "ok (180 questões)"
  }
}
```

---

## Setup Endpoint

### `/api/admin/2fa-setup` (POST / GET)

**Protections**: ✅ Setup Token (one-time use)

Generate TOTP secret and QR code. Should only be called **once** during setup.

**POST** - Generate secret:
```bash
curl -X POST http://localhost:3000/api/admin/2fa-setup \
  -H "x-setup-token: your-setup-token" \
  -H "Content-Type: application/json"
```

**GET** - Check setup status:
```bash
curl -X GET http://localhost:3000/api/admin/2fa-setup \
  -H "x-setup-token: your-setup-token"
```

---

## Example QR Code

The setup endpoint returns a base64-encoded PNG QR code:

```
data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAACr33GmAAAAB3RJTUUHBgoXBxs5Ag
AAAA50RVh0Q29tbWVudABHZW5lcmF0ZWQgd2l0aCBweThnaWYgMC4xLjAsIChD\n...
(truncated for brevity)
```

Save this to a file and scan:
```bash
# Extract from response JSON
jq '.qrCode' response.json > qr.png

# View
open qr.png  # macOS
xdg-open qr.png  # Linux
start qr.png  # Windows
```

---

## IP Whitelist Format

The `ADMIN_IPS` environment variable supports multiple formats:

### Exact IP Match
```
127.0.0.1
192.168.1.100
::1
```

### CIDR Notation (/24)
```
192.168.1.0/24  # All IPs from 192.168.1.0 to 192.168.1.255
10.0.0.0/24     # All IPs from 10.0.0.0 to 10.0.0.255
```

### Wildcard
```
192.168.*       # All IPs starting with 192.168.
10.*            # All IPs starting with 10.
```

### Combined Example
```
ADMIN_IPS=127.0.0.1,192.168.1.0/24,10.*,::1
```

---

## Recovery & Backup

### Recovery Code

When setting up TOTP, save the recovery code in a **secure location**:
- Password manager vault
- Offline encrypted backup
- Physical safe

If you lose access to your authenticator app, you can use the recovery code to regain access.

### Backup Secret

The `ADMIN_TOTP_SECRET` should also be backed up securely in case you need to:
1. Regenerate the QR code
2. Move to a different server
3. Restore access

---

## Security Best Practices

1. **Rotate TOTP Secrets**: Generate new secrets every 6-12 months
   - Run `POST /api/admin/2fa-setup` with new setup token
   - Update `ADMIN_TOTP_SECRET` in environment
   - Deploy and test before removing old secret

2. **IP Whitelist Maintenance**: Keep the whitelist minimal
   - Only include known admin office IPs
   - Use VPN IP if working remotely
   - Remove IPs when admin leaves the team

3. **Protect Setup Token**: Use a strong random token
   ```bash
   openssl rand -hex 32
   ```

4. **Monitor Logs**: Check for failed authentication attempts
   ```bash
   # Grep for auth failures
   grep "admin-auth" logs/error.log | grep -i "blocked\|invalid"
   ```

5. **Time Sync**: Ensure servers have accurate NTP time
   - TOTP depends on time synchronization (±30 seconds)
   - Incorrect server time will cause TOTP verification to fail

---

## Files Modified

1. **`lib/admin-auth.ts`** (NEW)
   - Core 2FA + IP whitelist middleware
   - `verifyAdminRequest()` - Main middleware function
   - `verifyTOTP()` - TOTP token verification
   - `generateTOTPSecret()` - Secret generation with QR code
   - `isIPWhitelisted()` - IP validation
   - `getClientIP()` - IP extraction from headers

2. **`app/api/admin/stats/route.ts`** (MODIFIED)
   - Added `verifyAdminRequest()` check
   - Replaced old `CRON_SECRET` auth with 2FA

3. **`app/api/admin/upgrade/route.ts`** (MODIFIED)
   - Added `verifyAdminRequest()` check
   - Replaced old `ADMIN_SECRET` auth with 2FA

4. **`app/api/admin/warm-cache/route.ts`** (MODIFIED)
   - Added `verifyAdminRequest()` check
   - Replaced old `CRON_SECRET` auth with 2FA

5. **`app/api/admin/2fa-setup/route.ts`** (NEW)
   - Setup endpoint for generating secrets
   - QR code generation
   - Setup status check

6. **`lib/__tests__/admin-auth.test.ts`** (NEW)
   - Unit tests for IP validation
   - TOTP generation and verification tests
   - Integration test scenarios (IP block, TOTP fail, TOTP success)

---

## Troubleshooting

### TOTP codes not working
- **Issue**: Code is always invalid
- **Check**:
  - Server time is synchronized (run `date` on server)
  - Secret is correctly set in `ADMIN_TOTP_SECRET`
  - Authenticator app shows codes that change every 30 seconds
  - You're entering the code within ±30 seconds of generation

### IP address not whitelisted
- **Issue**: "IP X.X.X.X is not whitelisted" error
- **Check**:
  - `ADMIN_IPS` environment variable is set
  - Your actual IP matches the whitelist (may be different from `curl -I ipecho.net`)
  - If behind proxy, headers are forwarded correctly
  - Try setting `x-admin-ip` header explicitly

### Setup token not working
- **Issue**: Setup endpoint returns 403
- **Check**:
  - `ADMIN_SETUP_TOKEN` is set in environment
  - You're using the exact token value
  - You haven't already run the setup endpoint (it's one-time)

---

## Dependencies

- `speakeasy` - TOTP generation and verification
- `qrcode` - QR code image generation
- `next` - Already present

Install with:
```bash
npm install speakeasy qrcode --legacy-peer-deps
```
