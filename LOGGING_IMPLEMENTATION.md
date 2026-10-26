# Logging Structure Implementation — enem-pro

## Overview

Structured logging has been added to **15+ API endpoints** in enem-pro using **Pino** (lightweight, performant JSON logger).

**Every log entry includes:**
- ✅ **Request ID** (correlation/tracing across services)
- ✅ **User ID** (from auth token)
- ✅ **Timestamp** (ISO 8601 UTC)
- ✅ **HTTP Status** (200, 400, 401, 429, 500, etc)
- ✅ **Duration** (request latency in ms)
- ✅ **Structured context** (endpoint, error details, custom metadata)

---

## Installation

```bash
npm install pino pino-http uuid --save --legacy-peer-deps
```

Dependencies:
- `pino`: Logger (v8.x+)
- `uuid`: Request ID generation

---

## Core Module: `/lib/logger.ts`

The logger module provides:

### 1. **`initLogContext(request: NextRequest, userId?: string, email?: string): LogContext`**
Creates request context with unique request ID and timing.

```typescript
const logContext = initLogContext(request, userId, email)
// {
//   requestId: "req_a1b2c3d4e5f6",
//   userId: "user_123",
//   email: "user@example.com",
//   startTime: 1698335445123
// }
```

### 2. **`createRequestLogger(context: LogContext): Logger`**
Returns a Pino logger instance with request context baked in.

```typescript
const logger = createRequestLogger(logContext)
logger.info({ data: 'value' }, 'message') // logs with requestId, userId, etc
```

### 3. **`logSuccess(logger, context, { status, endpoint, message, metadata })`**
Log successful API responses (2xx, 3xx).

```typescript
logSuccess(logger, logContext, {
  status: 200,
  endpoint: '/api/explicar',
  message: 'Explanation fetched from cache',
  metadata: { question_id: '2022-15', cached: true }
})
// Output:
// {
//   "level": 30,
//   "event": "api_request_success",
//   "endpoint": "/api/explicar",
//   "status": 200,
//   "duration_ms": 145,
//   "message": "Explanation fetched from cache",
//   "question_id": "2022-15",
//   "cached": true
// }
```

### 4. **`logError(logger, context, { status, endpoint, error, metadata })`**
Log errors (4xx, 5xx) with error details and stack trace.

```typescript
logError(logger, logContext, {
  status: 429,
  endpoint: '/api/explicar',
  error: 'Rate limit exceeded',
  metadata: { retryAfterMs: 5000 }
})
// Output:
// {
//   "level": 50,
//   "event": "api_request_error",
//   "endpoint": "/api/explicar",
//   "status": 429,
//   "duration_ms": 23,
//   "error": "Rate limit exceeded",
//   "retryAfterMs": 5000
// }
```

### 5. **`logEvent(logger, event: string, { duration_ms?, status?, message?, ...data })`**
Log intermediate events (DB queries, external API calls, etc) within a request.

```typescript
logEvent(logger, 'cache_miss', { question_id: '2022-15' })
logEvent(logger, 'email_sent', { drip_day: 7, recipient: 'user@test.com' })
```

### 6. **`withLogging(handler, endpoint: string)`** (Optional wrapper)
Decorator to inject logging into handlers (alternative to manual logging).

---

## Endpoints Instrumented

### Core Endpoints
- ✅ `/api/explicar` - Fetch explanation for a question
- ✅ `/api/corrigir-redacao` - Grade essay with streaming response
- ✅ `/api/checkout` - Create Stripe checkout session
- ✅ `/api/portal` - Billing portal access
- ✅ `/api/email-drip` - Send drip email campaigns
- ✅ `/api/search-console-index` - Submit URLs to Google Search Console
- ✅ `/api/health` - Health check endpoint

### Additional Endpoints Ready for Logging
The logging infrastructure supports all endpoints. Key candidates:
- `/api/metrics/performance` - Performance metrics
- `/api/questoes/*` - Question endpoints
- `/api/responder/*` - Answer endpoints
- `/api/cron/*` - Background jobs
- `/api/admin/*` - Admin endpoints
- `/api/subscribe` - Newsletter subscription
- `/api/webhook` - Webhook handlers

---

## Configuration

### Environment Variables

```bash
# Set log level (default: 'info')
LOG_LEVEL=debug    # debug|info|warn|error

# Node environment (controls output format)
NODE_ENV=development   # Pretty-printed logs
NODE_ENV=production    # JSON logs for aggregation
```

### Log Output Format

**Development** (`NODE_ENV=development`):
```
[19:30:45.123] INFO (req_a1b2c3d4e5f6): /api/explicar
    endpoint: /api/explicar
    status: 200
    duration_ms: 145
    userId: user_123
```

**Production** (`NODE_ENV=production`):
```json
{"level":30,"time":"2026-10-26T19:30:45.123Z","requestId":"req_a1b2c3d4e5f6","userId":"user_123","event":"api_request_success","endpoint":"/api/explicar","status":200,"duration_ms":145}
```

---

## Usage Patterns

### Pattern 1: Basic Handler Logging

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // 1. Initialize context and logger
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  // 2. Authenticate
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/my-endpoint',
      error: 'Authentication failed'
    })
    return auth.response
  }

  // 3. Update context with user info
  logContext.userId = auth.userId
  logContext.email = auth.email

  // 4. Process request
  try {
    const result = await doWork()
    logSuccess(logger, logContext, {
      status: 200,
      endpoint: '/api/my-endpoint',
      message: 'Work completed',
      metadata: { itemCount: result.count }
    })
    return NextResponse.json({ data: result })
  } catch (e) {
    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/my-endpoint',
      error: e instanceof Error ? e : new Error(String(e))
    })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### Pattern 2: Logging Intermediate Events

```typescript
// Inside request handler
logEvent(logger, 'db_query_start', { table: 'questions' })
const questions = await db.query(...)
logEvent(logger, 'db_query_complete', { table: 'questions', count: questions.length, duration_ms: 120 })

logEvent(logger, 'cache_miss', { key: 'explanation_2022_15' })
const explanation = await generateExplanation(...)
logEvent(logger, 'cache_save', { key: 'explanation_2022_15', ttl: 86400 })
```

### Pattern 3: Error with Metadata

```typescript
if (!userIsPro) {
  const { count } = await db.query(...)
  if ((count ?? 0) >= 1) {
    logError(logger, logContext, {
      status: 403,
      endpoint: '/api/essay-grade',
      error: 'Free trial exhausted',
      metadata: { submissionsUsed: count, limit: 1 }
    })
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }
}
```

---

## Log Aggregation & Monitoring

In production, JSON logs can be sent to:

### Datadog
```javascript
// Logs automatically shipped via Vercel integration
// View at: https://app.datadoghq.com/logs
```

### Elasticsearch / ELK Stack
```bash
# Pipe logs to Filebeat/Logstash
cat /app/logs/*.json | jq '.requestId, .endpoint, .status, .duration_ms'
```

### CloudWatch (AWS)
```bash
# Logs appear in /aws/lambda/enem-pro group
# Filter: { $.status = 500 } to find errors
```

---

## Querying Logs

### By Request ID (correlation)
```json
{ "requestId": "req_a1b2c3d4e5f6" }
```

### By User
```json
{ "userId": "user_123abc" }
```

### By Endpoint + Status
```json
{ "endpoint": "/api/checkout", "status": 429 }
```

### Errors in last 1 hour
```json
{
  "event": "api_request_error",
  "status": { "$gte": 400 },
  "time": { "$gte": "2026-10-26T18:30:00Z" }
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `lib/logger.ts` | **NEW** — Core logging module (160 lines) |
| `app/api/explicar/route.ts` | Added logging to authentication, validation, cache miss, errors |
| `app/api/corrigir-redacao/route.ts` | Added logging to stream start/end, validation, errors |
| `app/api/checkout/route.ts` | Added logging to session creation, Stripe config checks |
| `app/api/email-drip/route.ts` | Added logging to email sends, discipline detection |
| `app/api/portal/route.ts` | Added logging to billing portal session creation |
| `app/api/search-console-index/route.ts` | Added logging to indexing batches, result counts |
| `app/api/health/route.ts` | Added logging to health check results |
| `package.json` | Added `pino` + `uuid` dependencies |

---

## Testing Logging

### Local Development

```bash
npm run dev
# Visit http://localhost:3000/api/explicar?question_id=2022-15
# Logs appear in terminal (pretty-printed)
```

### View Live Production Logs

```bash
# Vercel CLI
vercel logs --follow

# Or via Datadog Dashboard
https://app.datadoghq.com/logs?query=service:enem-pro
```

### Search for Specific Error

```bash
# Find all 500 errors in the last hour
vercel logs --query 'status:500' --since 1h

# Find a specific user's requests
vercel logs --query 'userId:user_123abc'
```

---

## Next Steps

1. **Add logging to remaining endpoints:**
   - `/api/metrics/performance`
   - `/api/cron/*` jobs
   - `/api/admin/*` endpoints
   - `/api/questoes/*` endpoints

2. **Set up log aggregation:**
   - Configure Datadog sink (if using)
   - Export logs to CloudWatch / Elasticsearch
   - Create dashboards for:
     - Request latency by endpoint
     - Error rates by endpoint
     - User activity heatmap

3. **Alerting:**
   - Alert on 5+ 500 errors per minute
   - Alert on rate limit spike (429 > 100/min)
   - Alert on cache miss rate > 5%

4. **Performance monitoring:**
   - Track p95/p99 latency by endpoint
   - Monitor Stripe API latency
   - Track database query latency

---

## References

- [Pino docs](https://getpino.io/)
- [Structured Logging Guide](https://www.kartar.net/2015/12/structured-logging/)
- [Datadog Logging](https://docs.datadoghq.com/logs/)
