#!/usr/bin/env node
/**
 * Example: Logging Output in enem-pro
 *
 * This file demonstrates the structured logging output format.
 * Run this to see example logs from different endpoints.
 */

// ============================================================================
// DEVELOPMENT MODE (Pretty-printed with pino-pretty)
// ============================================================================

// Example 1: Successful request to /api/explicar
{
  "level": 30,
  "time": "2026-10-26T19:30:45.123Z",
  "pid": 1234,
  "hostname": "worker-prod-1",
  "requestId": "req_a1b2c3d4e5f6",
  "userId": "user_123abc",
  "email": "student@example.com",
  "event": "api_request_success",
  "endpoint": "/api/explicar",
  "status": 200,
  "duration_ms": 145,
  "message": "Explanation fetched from cache",
  "question_id": "2022-15"
}

// Example 2: Rate limit error
{
  "level": 40,
  "time": "2026-10-26T19:31:12.456Z",
  "requestId": "req_f6e5d4c3b2a1",
  "userId": "user_456def",
  "event": "api_request_error",
  "endpoint": "/api/explicar",
  "status": 429,
  "error": "Rate limit exceeded",
  "stack": "Error: Rate limit exceeded\n    at checkRateLimit (/app/lib/rate-limit.ts:42:15)\n    ...",
  "duration_ms": 23,
  "retryAfterMs": 5000
}

// Example 3: Authentication failure
{
  "level": 40,
  "time": "2026-10-26T19:32:00.789Z",
  "requestId": "req_789ghi012",
  "event": "api_request_error",
  "endpoint": "/api/checkout",
  "status": 401,
  "error": "Authentication failed",
  "duration_ms": 15
}

// Example 4: Stripe checkout session created
{
  "level": 30,
  "time": "2026-10-26T19:35:20.111Z",
  "requestId": "req_456jkl789",
  "userId": "user_789ghi",
  "email": "user@test.com",
  "event": "api_request_success",
  "endpoint": "/api/checkout",
  "status": 200,
  "duration_ms": 320,
  "message": "Checkout session created",
  "plan": "monthly",
  "sessionId": "cs_test_a1b2c3d4e5f6g7h8"
}

// Example 5: Email drip campaign sent
{
  "level": 30,
  "time": "2026-10-26T19:40:15.234Z",
  "requestId": "req_012mno345",
  "userId": "user_234jkl",
  "event": "api_request_success",
  "endpoint": "/api/email-drip",
  "status": 200,
  "duration_ms": 1200,
  "message": "Email sent",
  "drip_day": 7,
  "weakDiscipline": "Química"
}

// Example 6: Search console indexing batch
{
  "level": 30,
  "time": "2026-10-26T20:00:30.456Z",
  "requestId": "req_567pqr890",
  "event": "indexing_start",
  "totalUrls": 412,
  "slug": "all"
}

{
  "level": 30,
  "time": "2026-10-26T20:01:45.789Z",
  "requestId": "req_567pqr890",
  "event": "api_request_success",
  "endpoint": "/api/search-console-index",
  "status": 200,
  "duration_ms": 75000,
  "message": "Indexing completed",
  "totalUrls": 412,
  "successCount": 408,
  "failureCount": 4
}

// Example 7: Health check
{
  "level": 30,
  "time": "2026-10-26T20:05:00.123Z",
  "requestId": "req_890stu123",
  "event": "api_request_success",
  "endpoint": "/api/health",
  "status": 200,
  "duration_ms": 45,
  "message": "Health check: healthy",
  "checks": [
    "database",
    "stats_view",
    "cache",
    "ai_optimization"
  ],
  "errors": 0,
  "warnings": 0
}

// Example 8: Essay grading stream error
{
  "level": 40,
  "time": "2026-10-26T20:10:12.456Z",
  "requestId": "req_234vwx567",
  "userId": "user_567pqr",
  "event": "api_request_error",
  "endpoint": "/api/corrigir-redacao",
  "status": 500,
  "error": "Stream error during AI processing",
  "stack": "Error: Stream error during AI processing\n    at controller.enqueue (/app/app/api/corrigir-redacao/route.ts:115:20)\n    ...",
  "duration_ms": 2850,
  "stream": true
}

// Example 9: Free tier essay limit exceeded
{
  "level": 40,
  "time": "2026-10-26T20:15:30.789Z",
  "requestId": "req_678yza901",
  "userId": "user_890tuvw",
  "event": "api_request_error",
  "endpoint": "/api/corrigir-redacao",
  "status": 403,
  "error": "Free trial used",
  "duration_ms": 125
}

// Example 10: Portal session for billing
{
  "level": 30,
  "time": "2026-10-26T20:20:45.012Z",
  "requestId": "req_012bcd345",
  "userId": "user_234cde",
  "event": "api_request_success",
  "endpoint": "/api/portal",
  "status": 200,
  "duration_ms": 280,
  "message": "Billing portal session created",
  "customerId": "cus_J5k8Lm9Nop2Q"
}

// ============================================================================
// PRODUCTION MODE (JSON only)
// ============================================================================
// In production, logs are emitted as newline-delimited JSON (NDJSON)
// suitable for log aggregation services (DataDog, Elasticsearch, etc)

{"level":30,"time":"2026-10-26T19:30:45.123Z","requestId":"req_a1b2c3d4e5f6","userId":"user_123abc","email":"student@example.com","event":"api_request_success","endpoint":"/api/explicar","status":200,"duration_ms":145,"message":"Explanation fetched from cache","question_id":"2022-15"}
{"level":40,"time":"2026-10-26T19:31:12.456Z","requestId":"req_f6e5d4c3b2a1","userId":"user_456def","event":"api_request_error","endpoint":"/api/explicar","status":429,"error":"Rate limit exceeded","stack":"Error: Rate limit exceeded\n    at checkRateLimit (/app/lib/rate-limit.ts:42:15)","duration_ms":23,"retryAfterMs":5000}

// ============================================================================
// LOG STRUCTURE REFERENCE
// ============================================================================

/*
 * Standard fields in every log entry:
 *
 * @param {number} level - Pino log level (20=DEBUG, 30=INFO, 40=WARN, 50=ERROR)
 * @param {string} time - ISO 8601 timestamp (UTC)
 * @param {string} requestId - Unique request ID for correlation (req_12chars)
 * @param {string} userId - User ID (from auth token) - only if authenticated
 * @param {string} email - User email - only if authenticated
 * @param {string} event - Event type (api_request_success, api_request_error, indexing_start, etc)
 * @param {string} endpoint - API endpoint path (e.g., /api/explicar)
 * @param {number} status - HTTP status code (200, 400, 401, 429, 500, etc)
 * @param {number} duration_ms - Total request duration in milliseconds
 * @param {string} message - Human-readable message
 * @param {string} error - Error description or error message
 * @param {string} stack - Full error stack trace (only on errors)
 * @param {object} [metadata] - Additional context (plan, question_id, etc)
 *
 * Usage examples:
 *   - logSuccess() creates {level: 30, event: 'api_request_success', ...}
 *   - logError() creates {level: 50, event: 'api_request_error', error, stack, ...}
 *   - logEvent() creates {level: 30, event: <custom>, ...}
 */
