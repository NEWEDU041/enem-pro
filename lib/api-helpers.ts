import { NextResponse, NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logEvent, logError } from '@/lib/logger'

/**
 * Wraps an API route handler with a top-level try/catch so uncaught
 * errors return a structured 500 response with a server-side log,
 * instead of crashing the function without any trace.
 */
export function withErrorHandling<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    try {
      return await handler(...args)
    } catch (e) {
      console.error('[API Error]', e)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  }
}

/**
 * Wraps a handler with both error handling AND rate limiting
 * Use for authenticated endpoints that need rate limit protection
 * 
 * Automatically:
 * - Validates authorization header for userId
 * - Checks user's rate limit tier (free/pro)
 * - Returns 429 if limit exceeded
 * - Wraps errors in 500 response
 */
export function withRateLimitAndErrorHandling<A extends [NextRequest, ...unknown[]]>(
  handler: (...args: A) => Promise<Response>
): (...args: A) => Promise<Response> {
  return async (...args: A) => {
    const request = args[0]
    const pathname = new URL(request.url).pathname

    try {
      const logContext = initLogContext(request)
      const logger = createRequestLogger(logContext)

      // Extract userId from auth (simplified — your auth system may differ)
      const authHeader = request.headers.get('authorization')
      const bearerMatch = authHeader?.match(/^Bearer\s+([a-f0-9\-]+)$/i)
      
      if (!bearerMatch) {
        // Missing auth — let handler decide
        return await handler(...args)
      }

      const userId = bearerMatch[1]
      logContext.userId = userId

      // Check rate limit
      const supabase = createServerClient()
      const rlCheck = await checkUserRateLimit(userId, supabase, pathname)

      if (!rlCheck.ok) {
        logError(logger, logContext, {
          status: 429,
          endpoint: pathname,
          error: 'Rate limit exceeded',
          metadata: {
            tier: rlCheck.tier,
            remaining: rlCheck.remaining,
            retryAfter: rlCheck.retryAfterSeconds,
          },
        })

        const headers: Record<string, string> = {
          'Retry-After': String(rlCheck.retryAfterSeconds || 60),
          ...rlCheck.headers,
        }

        return NextResponse.json(
          {
            error: 'Limite de requisições atingido. Tente novamente em alguns instantes.',
            retryAfterSeconds: rlCheck.retryAfterSeconds,
            tier: rlCheck.tier,
            remaining: rlCheck.remaining,
          },
          { status: 429, headers }
        )
      }

      logEvent(logger, 'rate_limit_ok', {
        remaining: rlCheck.remaining,
        limit: rlCheck.limit,
      })

      // Call actual handler
      return await handler(...args)
    } catch (e) {
      console.error('[API Error]', e)
      return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
  }
}
