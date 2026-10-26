import pino, { Logger } from 'pino'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * Structured logging module for enem-pro API.
 * Provides request-scoped logging with:
 * - Request ID (correlation/tracing)
 * - User ID (from auth)
 * - Timestamp (ISO 8601)
 * - HTTP status & latency
 * - Structured context (body data, errors, etc)
 */

// Create a singleton logger instance
const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined, // Production: JSON to stdout
  timestamp: pino.stdTimeFunctions.isoTime,
})

/**
 * Request logger context: injected into each request
 * Contains request ID, user context, and timing info
 */
export interface LogContext {
  requestId: string
  userId?: string
  email?: string
  startTime: number
}

/**
 * Generate a unique request ID for correlation tracking
 */
function generateRequestId(): string {
  return `req_${uuidv4().replace(/-/g, '').substring(0, 12)}`
}

/**
 * Create a request-scoped logger with context
 */
export function createRequestLogger(context: LogContext): Logger {
  return pinoLogger.child({
    requestId: context.requestId,
    userId: context.userId,
    email: context.email,
  })
}

/**
 * Initialize logging context from a NextRequest
 * Extracts userId from auth context (expects auth to be pre-verified)
 */
export function initLogContext(request: NextRequest, userId?: string, email?: string): LogContext {
  return {
    requestId: generateRequestId(),
    userId,
    email,
    startTime: Date.now(),
  }
}

/**
 * Log a successful API response
 */
export function logSuccess(
  logger: Logger,
  context: LogContext,
  data: {
    status: number
    endpoint: string
    message?: string
    metadata?: Record<string, any>
  }
) {
  const duration = Date.now() - context.startTime
  logger.info(
    {
      event: 'api_request_success',
      endpoint: data.endpoint,
      status: data.status,
      duration_ms: duration,
      message: data.message,
      ...data.metadata,
    },
    `${data.endpoint} completed in ${duration}ms`
  )
}

/**
 * Log an API error (4xx/5xx)
 */
export function logError(
  logger: Logger,
  context: LogContext,
  data: {
    status: number
    endpoint: string
    error: string | Error
    metadata?: Record<string, any>
  }
) {
  const duration = Date.now() - context.startTime
  const errorMsg = typeof data.error === 'string' ? data.error : data.error.message
  const errorStack = data.error instanceof Error ? data.error.stack : undefined

  logger.error(
    {
      event: 'api_request_error',
      endpoint: data.endpoint,
      status: data.status,
      error: errorMsg,
      stack: errorStack,
      duration_ms: duration,
      ...data.metadata,
    },
    `${data.endpoint} failed with status ${data.status}`
  )
}

/**
 * Log structured events within a request (e.g., DB queries, external API calls)
 */
export function logEvent(
  logger: Logger,
  event: string,
  data: {
    duration_ms?: number
    status?: string
    message?: string
    [key: string]: any
  }
) {
  logger.info({ event, ...data }, event)
}

/**
 * Wrapper to inject logging into API route handlers
 * Usage:
 *   export const POST = withLogging(async (request, logger, logContext) => {
 *     // handler code
 *   })
 */
export function withLogging<A extends unknown[]>(
  handler: (request: NextRequest, logger: Logger, context: LogContext, ...args: A) => Promise<Response>,
  endpoint: string
) {
  return async (request: NextRequest, ...args: A): Promise<Response> => {
    const authHeader = request.headers.get('authorization') || ''
    // Note: You'll need to extract userId from auth token if needed
    // For now, just create context without userId
    const logContext = initLogContext(request)
    const logger = createRequestLogger(logContext)

    try {
      const response = await handler(request, logger, logContext, ...args)

      // Log response
      const status = response.status
      if (status >= 400) {
        logError(logger, logContext, {
          status,
          endpoint,
          error: `HTTP ${status}`,
        })
      } else {
        logSuccess(logger, logContext, {
          status,
          endpoint,
        })
      }

      return response
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      logError(logger, logContext, {
        status: 500,
        endpoint,
        error,
      })
      throw e
    }
  }
}

/**
 * Export the global logger for direct use
 */
export default pinoLogger
