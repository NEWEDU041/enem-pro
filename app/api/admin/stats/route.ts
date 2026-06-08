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

  const [usersRes, answersRes, answersToday, newUsersWeek, proRes, dripRes, cacheRes] =
    await Promise.all([
      sb.from('user_profiles').select('*', { count: 'exact', head: true }),
      sb.from('user_answers').select('*', { count: 'exact', head: true }),
      sb.from('user_answers').select('*', { count: 'exact', head: true }).gte('answered_at', today),
      sb.from('user_profiles').select('*', { count: 'exact', head: true }).gte('registered_at', weekAgo),
      sb.from('subscriptions').select('*', { count: 'exact', head: true })
        .eq('plan', 'pro').gt('expires_at', new Date().toISOString()),
      sb.from('email_drip_log').select('*', { count: 'exact', head: true }),
      sb.from('questions_cache').select('id, cached_at').order('cached_at', { ascending: false }).limit(1),
    ])

  return NextResponse.json({
    users: { total: usersRes.count ?? 0, new_week: newUsersWeek.count ?? 0 },
    answers: { total: answersRes.count ?? 0, today: answersToday.count ?? 0 },
    pro: { active: proRes.count ?? 0 },
    emails_sent: dripRes.count ?? 0,
    cache_last: cacheRes.data?.[0]?.cached_at ?? null,
  })
}
