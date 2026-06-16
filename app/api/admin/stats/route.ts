import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!secret || secret !== cleanEnv(process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServerClient()
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [usersRes, answersRes, answersToday, newUsersWeek, proRes, dripRes, cacheRes, paywallRes, aiUsageRes] =
    await Promise.all([
      sb.from('user_profiles').select('*', { count: 'exact', head: true }),
      sb.from('user_answers').select('*', { count: 'exact', head: true }),
      sb.from('user_answers').select('*', { count: 'exact', head: true }).gte('answered_at', today),
      sb.from('user_profiles').select('*', { count: 'exact', head: true }).gte('registered_at', weekAgo),
      sb.from('subscriptions').select('*', { count: 'exact', head: true })
        .eq('plan', 'pro').gt('expires_at', new Date().toISOString()),
      sb.from('email_drip_log').select('*', { count: 'exact', head: true }),
      sb.from('questions_cache').select('id, cached_at').order('cached_at', { ascending: false }).limit(1),
      // Usuários que bateram no paywall hoje (daily_usage.count >= 10)
      sb.from('daily_usage').select('user_id', { count: 'exact', head: true })
        .eq('date', today)
        .gte('count', 10),
      // Taxa de uso de IA (últimos 30 dias)
      sb.from('daily_usage').select('explanation_count, count')
        .gte('date', thirtyDaysAgo),
    ])

  // Calcular aiUsageRate: sum(explanation_count) / sum(count)
  type UsageRow = { explanation_count: number | null; count: number | null }
  const usageRows: UsageRow[] = (aiUsageRes.data as UsageRow[]) ?? []
  const totalAnswers30d = usageRows.reduce((acc, r) => acc + (r.count ?? 0), 0)
  const totalAI30d = usageRows.reduce((acc, r) => acc + (r.explanation_count ?? 0), 0)
  const aiUsageRate = totalAnswers30d > 0
    ? `${Math.round((totalAI30d / totalAnswers30d) * 100)}%`
    : '0%'

  // Calcular conversionRate: proCount / totalUsers
  const totalUsers = usersRes.count ?? 0
  const proCount = proRes.count ?? 0
  const conversionRate = totalUsers > 0
    ? `${Math.round((proCount / totalUsers) * 100)}%`
    : '0%'

  return NextResponse.json({
    users: { total: totalUsers, new_week: newUsersWeek.count ?? 0 },
    answers: { total: answersRes.count ?? 0, today: answersToday.count ?? 0 },
    pro: { active: proCount },
    emails_sent: dripRes.count ?? 0,
    cache_last: cacheRes.data?.[0]?.cached_at ?? null,
    paywallHitsToday: paywallRes.count ?? 0,
    aiUsageRate,
    conversionRate,
  })
}
