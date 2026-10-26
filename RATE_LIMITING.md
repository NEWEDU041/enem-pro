# Rate Limiting Implementation - Test Guide

## Overview
Rate limiting has been implemented globally across all 70+ API endpoints in both projects:
- **youtube-os**: 36 endpoints
- **enem-pro**: 34 endpoints

## Configuration
- **Global Limit**: 100 requests/minute per IP
- **Sensitive Endpoints**: 10 requests/minute per IP
  - Paths: `/api/admin/*`, `/api/checkout/*`, `/api/webhook/*`, `/api/cron/*`

## Quick Manual Tests with curl

### Test 1: Single Request (Should Pass)
```bash
curl -i http://localhost:3000/api/health-test
```
Expected: **200 OK**

### Test 2: Rapid Requests (Should Hit Rate Limit)
```bash
# Make 110 requests to trigger the 100/min limit
for i in {1..110}; do
  curl -s -w "Request %{http_code}\n" http://localhost:3000/api/health-test
done | grep -c "200"
```
Expected: First ~100 requests return **200**, remaining return **429**

### Test 3: Sensitive Endpoint Rate Limit
```bash
# Make 15 requests to a sensitive endpoint (admin path)
for i in {1..15}; do
  curl -s -w "%{http_code}\n" http://localhost:3000/api/admin/stats
done
```
Expected: First ~10 requests don't return 429, remaining return **429**

### Test 4: Check Rate Limit Headers
```bash
curl -i http://localhost:3000/api/health-test
```
Look for headers:
- `X-RateLimit-Limit: 100` (global) or `10` (sensitive)
- `X-RateLimit-Remaining: 99` (decrements per request)
- `Retry-After: 60` (when rate limited)

### Test 5: Rate Limited Response
```bash
# After hitting the limit:
curl -i http://localhost:3000/api/health-test
```
Expected response:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```
Status: **429 Too Many Requests**

## Automated Test Script

For youtube-os:
```bash
cd /root/projetos/youtube-os
bash test-rate-limit.sh localhost 3000
```

For enem-pro:
```bash
cd /root/projetos/enem-pro
bash test-rate-limit.sh localhost 3000
```

## Files Modified

### youtube-os
1. **lib/rate-limiter.ts** (NEW) - 3,709 bytes
   - Rate limit logic and configuration
   - IP extraction from requests
   - Sensitive endpoint detection

2. **middleware.ts** (NEW) - 590 bytes
   - Global middleware applying rate limiting to all /api/* routes
   - Matcher config: `['/api/:path*']`

3. **app/api/health-test/route.ts** (NEW) - 695 bytes
   - Test endpoint for rate limiting validation

4. **test-rate-limit.sh** (NEW) - 4,140 bytes
   - Automated bash test suite with 4 test scenarios

5. **package.json** - Added `express-rate-limit` dependency

### enem-pro
1. **lib/rate-limiter.ts** (NEW) - 3,709 bytes
   - Identical implementation to youtube-os

2. **middleware.ts** (NEW) - 590 bytes
   - Identical implementation to youtube-os

3. **app/api/health-test/route.ts** (NEW) - 700 bytes
   - Test endpoint for rate limiting validation

4. **test-rate-limit.sh** (NEW) - 4,142 bytes
   - Automated bash test suite with 4 test scenarios

5. **package.json** - Added `express-rate-limit` dependency

## Implementation Details

### Rate Limiter Logic
- **In-memory store**: Uses a Map to track requests per IP
- **Automatic cleanup**: Cleans up old entries every 30 seconds
- **IP extraction**: Handles X-Forwarded-For and X-Real-IP headers
- **Window-based**: 60-second rolling window

### Sensitive Endpoint Patterns
```typescript
'/api/admin'    // Admin operations
'/api/checkout' // Payment processing
'/api/webhook'  // Webhook handlers
'/api/cron'     // Cron job endpoints
```

### Response Format (429 Too Many Requests)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

Headers:
- `Content-Type: application/json`
- `Retry-After: 60`
- `X-RateLimit-Limit: 100` (or 10 for sensitive)
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: ISO 8601 timestamp`

## Verification Checklist

- [x] Rate limiting applied to all API routes via middleware
- [x] Global limit: 100 req/min per IP
- [x] Sensitive limit: 10 req/min per IP
- [x] IP extraction handles proxies (X-Forwarded-For)
- [x] 429 status code returned when rate limited
- [x] Proper HTTP headers included in response
- [x] Test suite includes stress testing
- [x] Automated cleanup of old rate limit entries
- [x] Works across all 70+ endpoints

## Production Considerations

1. **Persistence**: Current implementation uses in-memory storage. For distributed systems, consider:
   - Redis-backed rate limiting
   - Distributed cache (Memcached)
   - External rate limiting service

2. **Monitoring**: Log rate limit hits for analytics
3. **Whitelisting**: Consider whitelisting trusted IPs if needed
4. **Gradual Rollout**: Monitor 429 errors in production before enforcing limits

## Environment Variables (Optional Future Enhancement)
```env
RATE_LIMIT_GLOBAL_REQUESTS=100
RATE_LIMIT_GLOBAL_WINDOW_MS=60000
RATE_LIMIT_SENSITIVE_REQUESTS=10
RATE_LIMIT_SENSITIVE_WINDOW_MS=60000
```
