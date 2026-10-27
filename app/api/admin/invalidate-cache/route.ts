import { NextRequest, NextResponse } from 'next/server'
import { invalidateCache, invalidateCacheBatch, getMetrics, getHitRate } from '@/lib/cache'
import { withErrorHandling } from '@/lib/api-helpers'
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/admin-auth'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/invalidate-cache
 * 
 * Invalidate cache entries for questions/explanations.
 * Supports both single and batch invalidation.
 * 
 * Request body:
 * - mode: 'single' | 'batch' | 'metrics' | 'all'
 * - type?: 'explanation' (required for single/batch)
 * - ids?: string[] (required for batch)
 * - id?: string (required for single)
 * 
 * Returns cache metrics before and after invalidation.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Verify IP whitelist + TOTP
  const auth = await verifyAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized')
  }

  const body = await request.json()
  const { mode = 'single', type = 'explanation', ids = [], id = '' } = body

  const metricsBefore = getMetrics(type as any)

  if (mode === 'metrics') {
    // Return current metrics only
    return NextResponse.json({
      success: true,
      mode: 'metrics',
      type,
      metrics: metricsBefore,
      hitRate: getHitRate(type as any),
      avgLatency: metricsBefore
        ? (metricsBefore.totalLatency / Math.max(metricsBefore.requestCount, 1)).toFixed(2)
        : 0,
    })
  }

  if (mode === 'all') {
    // Invalidate ALL explanations by fetching all question IDs from DB
    const supabase = createServerClient()
    const { data: questions, error } = await supabase
      .from('questions')
      .select('id')
      .limit(10000)

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch questions: ${error.message}` },
        { status: 500 }
      )
    }

    const invalidations = (questions || []).map((q: any) => ({
      type: 'explanation',
      id: q.id,
    }))

    const deleted = await invalidateCacheBatch(invalidations)
    const metricsAfter = getMetrics(type as any)

    return NextResponse.json({
      success: true,
      mode: 'all',
      deleted,
      totalQuestions: questions?.length || 0,
      metricsBefore,
      metricsAfter,
      hitRateBefore: getHitRate(type as any),
      hitRateAfter: getHitRate(type as any),
    })
  }

  if (mode === 'batch' && ids.length > 0) {
    // Batch invalidate multiple IDs
    const invalidations = ids.map((questionId: string) => ({
      type,
      id: questionId,
    }))

    const deleted = await invalidateCacheBatch(invalidations)
    const metricsAfter = getMetrics(type as any)

    return NextResponse.json({
      success: true,
      mode: 'batch',
      count: ids.length,
      deleted,
      metricsBefore,
      metricsAfter,
      hitRateBefore: getHitRate(type as any),
      hitRateAfter: getHitRate(type as any),
    })
  }

  if (mode === 'single' && id) {
    // Single invalidate
    const success = await invalidateCache(type as any, id)
    const metricsAfter = getMetrics(type as any)

    return NextResponse.json({
      success,
      mode: 'single',
      type,
      id,
      metricsBefore,
      metricsAfter,
      hitRateBefore: getHitRate(type as any),
      hitRateAfter: getHitRate(type as any),
    })
  }

  return NextResponse.json(
    { error: 'Invalid request: missing required parameters' },
    { status: 400 }
  )
})

/**
 * GET /api/admin/invalidate-cache
 * 
 * Return current cache metrics for all cache types
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Verify IP whitelist + TOTP
  const auth = await verifyAdminRequest(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error || 'Unauthorized')
  }

  const allMetrics = getMetrics()
  const metricsWithHitRates = Object.entries(allMetrics).reduce(
    (acc, [type, metrics]) => {
      acc[type] = {
        ...metrics,
        hitRate: getHitRate(type as any),
        avgLatency:
          metrics.requestCount > 0
            ? (metrics.totalLatency / metrics.requestCount).toFixed(2)
            : 0,
      }
      return acc
    },
    {} as Record<string, any>
  )

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: metricsWithHitRates,
  })
})
