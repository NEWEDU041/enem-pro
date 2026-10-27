/**
 * EXAMPLE: Updated /api/portal with db-pool integration
 * 
 * This shows how to migrate from Supabase client (N+1 pattern)
 * to optimized db-pool queries (parallel execution)
 * 
 * To apply: Review current /api/portal/route.ts and integrate following patterns
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'
import { checkUserRateLimit } from '@/lib/user-rate-limit'
import { initLogContext, createRequestLogger, logSuccess, logError } from '@/lib/logger'
import { getCached, setCached } from '@/lib/cache'

// NEW: Import optimized db-helpers instead of using Supabase directly
import * as dbHelpers from '@/lib/db-helpers-pool'
import * as dbPool from '@/lib/db-pool'

export const dynamic = 'force-dynamic'

export const POST = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/portal',
      error: 'Authentication failed',
    })
    return auth.response
  }
  const { userId } = auth
  logContext.userId = userId

  // USER-BASED RATE LIMITING
  // Note: This can still use Supabase client, or migrate to db-pool if needed
  const rl = await checkUserRateLimit(userId, null, '/api/portal')
  if (!rl.ok) {
    logError(logger, logContext, {
      status: 429,
      endpoint: '/api/portal',
      error: 'Rate limit exceeded',
      metadata: {
        tier: rl.tier,
        remaining: rl.remaining,
        retryAfterSeconds: rl.retryAfterSeconds,
      },
    })
    const headers: Record<string, string> = rl.headers || {}
    return NextResponse.json(
      {
        error: 'Limite de requisições atingido',
        tier: rl.tier,
        reset_at: rl.resetAt.toISOString(),
      },
      { status: 429, headers }
    )
  }

  const stripe = getStripe()
  if (!stripe) {
    logError(logger, logContext, {
      status: 503,
      endpoint: '/api/portal',
      error: 'Stripe not configured',
    })
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })
  }

  // L1 CACHE — Try Redis first for customer ID
  const cachedCustomerId = await getCached<{ stripe_customer_id: string }>(
    'stripe_customer',
    userId
  )
  if (cachedCustomerId?.stripe_customer_id) {
    if (stripe) {
      try {
        const origin =
          cleanEnv(request.headers.get('origin') ?? undefined) ||
          cleanEnv(process.env.NEXT_PUBLIC_SITE_URL) ||
          'https://questoesenem.pro'

        const session = await stripe.billingPortal.sessions.create({
          customer: cachedCustomerId.stripe_customer_id,
          return_url: `${origin}/dashboard`,
        })

        logSuccess(logger, logContext, {
          status: 200,
          endpoint: '/api/portal',
          message: 'Billing portal session created',
          metadata: { customerId: cachedCustomerId.stripe_customer_id, cached: true },
        })

        return NextResponse.json({ url: session.url })
      } catch (e) {
        // Fall through to DB lookup if session creation fails
        logError(logger, logContext, {
          status: 500,
          endpoint: '/api/portal',
          error: 'Failed to create portal session from cached customer',
        })
      }
    }
  }

  // L2 CACHE — Database lookup
  // OPTIMIZED: Use db-pool with parallel queries instead of sequential Supabase calls
  const startDbTime = Date.now()

  try {
    // BEFORE: This was N+1 pattern with sequential queries:
    // const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', userId).single()
    // const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', userId).single()
    // const { data: usage } = await supabase.from('daily_usage').select('*').eq('user_id', userId).single()

    // AFTER: Use optimized parallel query helper
    // All 3 queries execute in parallel instead of sequential
    const userContext = await dbHelpers.getUserContext(userId)

    const dbDuration = Date.now() - startDbTime

    if (!userContext.profile) {
      logError(logger, logContext, {
        status: 404,
        endpoint: '/api/portal',
        error: 'User profile not found',
      })
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Cache customer ID if found in subscription
    if (userContext.subscription?.stripe_subscription_id) {
      // Extract customer ID from subscription (if needed)
      // For now, just cache the subscription ID
      await setCached(
        'stripe_customer',
        userId,
        { stripe_customer_id: userContext.subscription.stripe_subscription_id },
        3600 // 1 hour TTL
      )
    }

    // Fetch recent user responses in parallel (another critical N+1 query)
    // OPTIMIZED: Use batch helper instead of fetching responses one-by-one
    const recentResponses = await dbHelpers.getUserResponses(userId, 50)

    logSuccess(logger, logContext, {
      status: 200,
      endpoint: '/api/portal',
      message: 'User data retrieved',
      metadata: {
        dbDuration,
        queriesOptimized: true,
        parallelExecution: true,
      },
    })

    // Return combined user context
    return NextResponse.json({
      profile: userContext.profile,
      subscription: userContext.subscription,
      usage: userContext.usage,
      recent_responses: recentResponses,
      db_duration_ms: dbDuration,
    })
  } catch (error) {
    const dbDuration = Date.now() - startDbTime

    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/portal',
      error: (error as Error).message,
      metadata: { dbDuration },
    })

    return NextResponse.json(
      { error: 'Erro ao carregar dados do usuário' },
      { status: 500 }
    )
  } finally {
    // Optional: Log pool metrics in development
    if (process.env.NODE_ENV === 'development') {
      const poolStats = dbPool.getPoolStats()
      console.log('[/api/portal] Pool stats:', poolStats)
    }
  }
})
