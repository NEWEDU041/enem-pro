/**
 * Rate Limit Analytics Dashboard API
 * GET /api/admin/rate-limit-analytics
 * 
 * Returns:
 * - Top users by request count
 * - Tier distribution
 * - Daily usage trends
 * - Rate limit violation history
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { withErrorHandling } from '@/lib/api-helpers'
import { initLogContext, createRequestLogger, logError, logSuccess } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const logContext = initLogContext(request)
  const logger = createRequestLogger(logContext)

  // Admin auth check
  const auth = await requireAuth(request)
  if (!auth.ok) {
    logError(logger, logContext, {
      status: 401,
      endpoint: '/api/admin/rate-limit-analytics',
      error: 'Authentication failed',
    })
    return auth.response
  }

  const supabase = createServerClient()

  // Verify admin role via custom claim in JWT
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user?.user_metadata?.role === 'admin'

  if (!isAdmin) {
    logError(logger, logContext, {
      status: 403,
      endpoint: '/api/admin/rate-limit-analytics',
      error: 'Admin access required',
    })
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const last7Days = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    // 1. Top users by request count (today)
    const { data: topUsers, error: topUsersError } = await supabase
      .from('user_rate_limit_counters')
      .select('user_id, daily_count, tier:subscriptions(plan)')
      .eq('date', today)
      .order('daily_count', { ascending: false })
      .limit(20)

    if (topUsersError) {
      throw new Error(`Top users query failed: ${topUsersError.message}`)
    }

    // 2. Tier distribution (current active subscriptions)
    const { data: tierDist, error: tierDistError } = await supabase
      .from('subscriptions')
      .select('plan', { count: 'exact' })
      .gt('expires_at', new Date().toISOString())

    if (tierDistError) {
      throw new Error(`Tier distribution query failed: ${tierDistError.message}`)
    }

    // 3. Daily usage trends (last 7 days)
    const { data: dailyTrends, error: dailyTrendsError } = await supabase
      .from('user_rate_limit_counters')
      .select('date, daily_count')
      .gte('date', last7Days)
      .lte('date', today)
      .order('date', { ascending: true })

    if (dailyTrendsError) {
      throw new Error(`Daily trends query failed: ${dailyTrendsError.message}`)
    }

    // Aggregate daily trends
    const trendsByDate = new Map<string, { date: string; totalRequests: number; userCount: number }>()
    dailyTrends?.forEach((record: any) => {
      if (!trendsByDate.has(record.date)) {
        trendsByDate.set(record.date, { date: record.date, totalRequests: 0, userCount: 0 })
      }
      const entry = trendsByDate.get(record.date)!
      entry.totalRequests += record.daily_count
      entry.userCount += 1
    })

    const dailyTrendsList = Array.from(trendsByDate.values())

    // 4. Rate limit violations (users who hit limits)
    const { data: violations, error: violationsError } = await supabase
      .from('user_rate_limit_counters')
      .select('user_id, date, daily_count, limit:tier_config(daily_limit)')
      .eq('date', today)
      .gte('daily_count', 90) // 90% or more of limit

    if (violationsError) {
      throw new Error(`Violations query failed: ${violationsError.message}`)
    }

    // Calculate tier distribution
    const tierCounts = { free: 0, pro: 0 }
    tierDist?.forEach((sub: any) => {
      if (sub.plan === 'pro') tierCounts.pro++
      else tierCounts.free++
    })

    logSuccess(logger, logContext, {
      status: 200,
      endpoint: '/api/admin/rate-limit-analytics',
      message: 'Analytics retrieved',
      metadata: {
        topUsersCount: topUsers?.length ?? 0,
        trendDays: dailyTrendsList.length,
        violationCount: violations?.length ?? 0,
      },
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      period: { date: today, last7Days },
      summary: {
        totalTiers: tierCounts.free + tierCounts.pro,
        freetierUsers: tierCounts.free,
        proTierUsers: tierCounts.pro,
        proPercentage: ((tierCounts.pro / (tierCounts.free + tierCounts.pro)) * 100).toFixed(1),
      },
      topUsers: topUsers?.map((u: any) => ({
        user_id: u.user_id,
        daily_requests: u.daily_count,
        percentage_used: ((u.daily_count / 100) * 100).toFixed(1), // Free tier has 100 limit
      })) || [],
      dailyTrends: dailyTrendsList,
      rateLimitViolations: {
        count: violations?.length ?? 0,
        recent: violations?.slice(0, 10)?.map((v: any) => ({
          user_id: v.user_id,
          date: v.date,
          requests: v.daily_count,
          percent_of_limit: ((v.daily_count / 100) * 100).toFixed(1),
        })) || [],
      },
      tierConfig: {
        free: { daily_limit: 100, hourly_limit: 20, burst_limit: 5 },
        pro: { daily_limit: 10000, hourly_limit: 2000, burst_limit: 100 },
      },
    })
  } catch (error) {
    logError(logger, logContext, {
      status: 500,
      endpoint: '/api/admin/rate-limit-analytics',
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
})
