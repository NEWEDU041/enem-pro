/**
 * Express-like middleware for rate limiting all API endpoints
 * Wraps route handlers with automatic rate limit checks
 * 
 * Usage:
 * export const POST = withRateLimit(async (request) => { ... })
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logEvent, logError } from '@/lib/logger'

export interface RateLimitOptions {
  /**
   * Skip rate limiting for these paths (e.g., health checks, webhooks)
   */
  skipPaths?: string[]
  /**
   * Skip rate limiting for unauthenticated requests
   */
  requireAuth?: boolean
  /**
   * Custom rate limit tier for this endpoint
   */
  customTier?: 'free' | 'pro'
  /**
   * Custom burst limit (requests per minute)
   */
  burstLimit?: number
}

/**
 * Middleware wrapper for rate limiting
 * Automatically checks user-based rate limits before executing handler
 */
export function withRateLimit<T extends NextRequest>(
  handler: (request: T) => Promise<NextResponse | Response>,
  options: RateLimitOptions = {},
) {
  return async (request: T) => {
    const { skipPaths = [], requireAuth = true } = options

    // Check if path should skip rate limiting
    const pathname = new URL(request.url).pathname
    if (skipPaths.some((p) => pathname.includes(p))) {
      return handler(request)
    }

    const logContext = initLogContext(request)
    const logger = createRequestLogger(logContext)

    try {
      // Try to get userId from auth headers
      // This is a basic implementation — extend with your auth system
      const authHeader = request.headers.get('authorization')
      const userId = extractUserIdFromAuth(authHeader)

      if (requireAuth && !userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (userId) {
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

          const headers: Record<string, string> = rlCheck.headers || {}
          return NextResponse.json(
            {
              error: 'Too many requests. Please try again later.',
              retryAfterSeconds: rlCheck.retryAfterSeconds,
              tier: rlCheck.tier,
            },
            { status: 429, headers },
          )
        }

        logEvent(logger, 'rate_limit_ok', {
          remaining: rlCheck.remaining,
          limit: rlCheck.limit,
        })
      }

      // Call the actual handler
      return await handler(request)
    } catch (error) {
      logError(logger, logContext, {
        status: 500,
        endpoint: pathname,
        error: error instanceof Error ? error.message : String(error),
      })

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      )
    }
  }
}

/**
 * Extract userId from Bearer token or custom header
 * Extend this based on your authentication implementation
 */
function extractUserIdFromAuth(authHeader: string | null): string | null {
  if (!authHeader) return null

  // Bearer token format: "Bearer {userId}" or "Bearer jwt:{userId}"
  const parts = authHeader.split(' ')
  if (parts.length !== 2) return null

  const [scheme, credentials] = parts
  if (scheme.toLowerCase() !== 'bearer') return null

  // Simple format: just return the token (your auth layer should validate this)
  // In production, you'd decode JWT and extract userId
  if (credentials.startsWith('jwt:')) {
    return credentials.substring(4).split('.')[0] // Very basic extraction
  }

  return credentials // Direct userId (for service-to-service auth)
}
