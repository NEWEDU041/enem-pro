import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request: NextRequest) => {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServerClient()

  // Optimized: Single query to materialized view (1 instead of 9)
  const { data: stats, error } = await sb
    .from('stats_snapshot')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !stats) {
    console.error('[admin/stats] Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }

  // Calculate rates from aggregated data
  const totalUsers = stats.total_users ?? 0
  const totalAnswers30d = stats.total_answers_30d ?? 0
  const aiUsage30d = stats.ai_explanations_30d ?? 0

  const aiUsageRate = totalAnswers30d > 0
    ? `${Math.round((aiUsage30d / totalAnswers30d) * 100)}%`
    : '0%'

  const conversionRate = totalUsers > 0
    ? `${Math.round((stats.pro_active / totalUsers) * 100)}%`
    : '0%'

  return NextResponse.json({
    users: { total: stats.total_users ?? 0, new_week: stats.new_users_week ?? 0 },
    answers: { total: stats.total_answers ?? 0, today: stats.answers_today ?? 0 },
    pro: { active: stats.pro_active ?? 0 },
    emails_sent: stats.emails_sent ?? 0,
    cache_last: stats.cache_last_update ?? null,
    paywallHitsToday: stats.paywall_hits_today ?? 0,
    aiUsageRate,
    conversionRate,
  })
})
