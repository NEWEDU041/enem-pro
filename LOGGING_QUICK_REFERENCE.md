#!/usr/bin/env node
/**
 * Quick Reference: Logging in enem-pro
 * Copy-paste these patterns into new endpoints
 */

// ============================================================================
// PATTERN 1: Minimal logging (copy this template)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // Initialize logger
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  try {
    // Your handler logic here
    const result = await doSomething()

    // Log success
    logSuccess(logger, logContext, {
      status: 200,
      endpoint: '/api/your-endpoint',
      message: 'Operation completed',
      metadata: { itemCount: result.length }
    })

    return NextResponse.json({ data: result })
  } catch (e) {
    // Log error
    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/your-endpoint',
      error: e instanceof Error ? e : new Error(String(e))
    })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ============================================================================
// PATTERN 2: With authentication
// ============================================================================

import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/your-endpoint',
      error: 'Authentication failed'
    })
    return auth.response
  }

  // Update context with user info
  logContext.userId = auth.userId
  logContext.email = auth.email

  // Rest of handler...
}

// ============================================================================
// PATTERN 3: Logging intermediate events
// ============================================================================

import { logEvent } from '@/lib/logger'

// Inside handler:
logEvent(logger, 'db_query_start', { table: 'questions' })
const data = await db.select().from('questions')
logEvent(logger, 'db_query_complete', { 
  table: 'questions', 
  rows: data.length, 
  duration_ms: 120 
})

// ============================================================================
// PATTERN 4: Logging with validation
// ============================================================================

if (!email || !email.includes('@')) {
  logError(logger, logContext, {
    status: 400,
    endpoint: '/api/your-endpoint',
    error: 'Invalid email format',
    metadata: { email }  // Include what was invalid
  })
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
}

// ============================================================================
// LOGGING METHODS QUICK REFERENCE
// ============================================================================

/**
 * logSuccess(logger, context, { status, endpoint, message?, metadata? })
 * - Use for 2xx/3xx responses
 * - Sets event='api_request_success', level=30 (INFO)
 * - Includes duration_ms automatically
 */
logSuccess(logger, logContext, {
  status: 200,
  endpoint: '/api/user',
  message: 'User profile fetched',
  metadata: { userId: '123' }
})
// →  { event: 'api_request_success', status: 200, duration_ms: 45, ... }

/**
 * logError(logger, context, { status, endpoint, error, metadata? })
 * - Use for 4xx/5xx responses
 * - Sets event='api_request_error', level=50 (ERROR)
 * - Includes stack trace automatically
 * - error can be string or Error instance
 */
logError(logger, logContext, {
  status: 404,
  endpoint: '/api/user',
  error: 'User not found',
  metadata: { userId: 'abc123' }
})
// → { event: 'api_request_error', status: 404, error: '...', stack: '...', ... }

/**
 * logEvent(logger, eventName, { duration_ms?, status?, message?, ...custom })
 * - Use for intermediate events (NOT request start/end)
 * - Sets event=<eventName>, level=30 (INFO)
 * - No automatic duration tracking (set manually if needed)
 */
logEvent(logger, 'email_sent', { 
  recipient: 'user@test.com', 
  drip_day: 7 
})
// → { event: 'email_sent', recipient: 'user@test.com', drip_day: 7, ... }

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Rate limit error
if (!rateLimitOk) {
  logError(logger, logContext, {
    status: 429,
    endpoint: '/api/explain',
    error: 'Rate limit exceeded',
    metadata: { retryAfterMs: 5000 }
  })
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': '5' } }
  )
}

// Database error
try {
  const user = await db.users.find(userId)
} catch (e) {
  logError(logger, logContext, {
    status: 500,
    endpoint: '/api/profile',
    error: e instanceof Error ? e : new Error(String(e)),
    metadata: { userId, operation: 'find_user' }
  })
  return NextResponse.json({ error: 'Database error' }, { status: 500 })
}

// Validation error
if (typeof amount !== 'number' || amount < 0) {
  logError(logger, logContext, {
    status: 400,
    endpoint: '/api/charge',
    error: 'Invalid amount',
    metadata: { amount, type: typeof amount }
  })
  return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
}

// Cache hit
logEvent(logger, 'cache_hit', { key: 'explanation_2022_15' })

// Cache miss
logEvent(logger, 'cache_miss', { key: 'explanation_2022_15' })

// External API call
logEvent(logger, 'stripe_api_call', { 
  method: 'checkout.sessions.create',
  duration_ms: 320
})

// ============================================================================
// ENVIRONMENT & CONFIG
// ============================================================================

// Development: Pretty-printed logs
NODE_ENV=development npm run dev
// Output: Colored, readable log entries in terminal

// Production: JSON logs
NODE_ENV=production npm run build
// Output: Newline-delimited JSON (NDJSON) for log aggregation

// Control log level
LOG_LEVEL=debug npm run dev   # Show all (debug, info, warn, error)
LOG_LEVEL=info npm run dev    # Default: info, warn, error
LOG_LEVEL=error npm run dev   # Errors only

// ============================================================================
// QUERYING LOGS
// ============================================================================

// By request ID (correlation across requests)
logs | grep "requestId: req_a1b2c3d4e5f6"

// By user
logs | grep "userId: user_123"

// By endpoint
logs | grep "endpoint: /api/checkout"

// By status
logs | grep "status: 429"

// Errors only
logs | grep '"level":50'

// Recent errors (jq)
logs | jq 'select(.event == "api_request_error")'

// Slow requests (>1000ms)
logs | jq 'select(.duration_ms > 1000)'

// ============================================================================
// DEBUGGING
// ============================================================================

// What's in logContext?
console.log(logContext)
// {
//   requestId: "req_a1b2c3d4e5f6",
//   userId: undefined,        // Set after auth
//   email: undefined,         // Set after auth
//   startTime: 1698335445123
// }

// What gets logged automatically?
// Every log includes:
// - level (Pino level: 30=INFO, 40=WARN, 50=ERROR)
// - time (ISO 8601 timestamp)
// - requestId (unique per request)
// - userId, email (if authenticated)
// - hostname, pid (Pino default)

// What about errors?
logError(logger, logContext, {
  status: 500,
  endpoint: '/api/user',
  error: new Error('Database connection failed')
})
// Automatically includes:
// - error: "Database connection failed"
// - stack: Full stack trace

// ============================================================================
// TIPS & GOTCHAS
// ============================================================================

// ✅ DO: Update logContext with user ID after auth
logContext.userId = auth.userId
logContext.email = auth.email

// ❌ DON'T: Create a new context for every log
const logger1 = createRequestLogger(initLogContext(request)) // Don't do this!

// ✅ DO: Reuse logContext and logger throughout handler
const logContext = initLogContext(request)
const logger = createRequestLogger(logContext)
// ... use logger and logContext throughout

// ✅ DO: Pass Error objects to logError
logError(logger, logContext, {
  status: 500,
  endpoint: '/api/user',
  error: e instanceof Error ? e : new Error(String(e))  // Gets stack trace!
})

// ✅ DO: Use metadata for request-specific data
logSuccess(logger, logContext, {
  status: 200,
  endpoint: '/api/user',
  metadata: { userId, planType, purchaseId }
})

// ❌ DON'T: Log sensitive data
// Never log: passwords, API keys, tokens, credit cards
logError(logger, logContext, {
  error: error.message,  // ✅ OK
  // WRONG: metadata: { password, stripe_key, auth_token }
})

// ============================================================================
// REFERENCE LINKS
// ============================================================================

// Full implementation guide:
// /root/projetos/enem-pro/LOGGING_IMPLEMENTATION.md

// Log output examples:
// /root/projetos/enem-pro/LOGGING_EXAMPLES.md

// This file:
// /root/projetos/enem-pro/LOGGING_QUICK_REFERENCE.md
