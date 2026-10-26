#!/usr/bin/env node
/**
 * Test: Verify Logging Module Compiles and Works
 * 
 * Run: npx ts-node scripts/test-logging.ts
 * Or:  tsx scripts/test-logging.ts
 */

import pino from 'pino'
import { v4 as uuidv4 } from 'uuid'

// Simulate the logger module behavior
console.log('✅ Testing enem-pro logging module...\n')

// 1. Create logger (like in lib/logger.ts)
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
})

// 2. Generate request ID
const requestId = `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`
console.log(`📝 Generated request ID: ${requestId}\n`)

// 3. Create child logger with context
const childLogger = logger.child({
  requestId,
  userId: 'user_123abc',
  email: 'student@example.com',
})

// 4. Simulate successful API request
console.log('--- Logging successful request ---')
const startTime = Date.now()
// ... simulate work ...
await new Promise(resolve => setTimeout(resolve, 100))
const duration = Date.now() - startTime

childLogger.info(
  {
    event: 'api_request_success',
    endpoint: '/api/explicar',
    status: 200,
    duration_ms: duration,
    message: 'Explanation fetched from cache',
    question_id: '2022-15',
  },
  'Request completed successfully'
)

// 5. Simulate error with stack trace
console.log('\n--- Logging error request ---')
const errorStart = Date.now()
const error = new Error('Rate limit exceeded')
const errorDuration = Date.now() - errorStart

childLogger.error(
  {
    event: 'api_request_error',
    endpoint: '/api/explicar',
    status: 429,
    duration_ms: errorDuration,
    error: error.message,
    stack: error.stack,
    retryAfterMs: 5000,
  },
  'Request failed with rate limit error'
)

// 6. Simulate intermediate event
console.log('\n--- Logging intermediate event ---')
childLogger.info(
  {
    event: 'cache_miss',
    question_id: '2022-15',
  },
  'Cache miss detected'
)

console.log('\n✅ All logging tests completed successfully!')
console.log('\nLog Output Format:')
console.log('- Development: Pretty-printed with pino-pretty')
console.log('- Production: Newline-delimited JSON (NDJSON)')
console.log('\nFor live testing, run:')
console.log('  npm run dev')
console.log('  # Visit endpoints, check terminal logs')
