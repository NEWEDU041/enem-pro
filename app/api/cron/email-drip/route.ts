import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendDripEmail } from '@/lib/resend'
import { cleanEnv } from '@/lib/utils'
import { dripDailyGoogleIndex } from '@/lib/google-indexing'

export const dynamic = 'force-dynamic'

const DRIP_DAYS = [1, 3, 7, 14, 21, 30]
const BATCH_SIZE = 50

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

async function getWeakDisc(
  sb: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<string | undefined> {
  const { data: answers } = await sb
    .from('user_answers')
    .select('discipline, is_correct')
    .eq('user_id', userId)
    .limit(200)

  if (!answers?.length) return undefined

  const byDisc: Record<string, { total: number; correct: number }> = {}
  for (const a of answers) {
    if (!a.discipline) continue
    if (!byDisc[a.discipline]) byDisc[a.discipline] = { total: 0, correct: 0 }
    byDisc[a.discipline].total++
    if (a.is_correct) byDisc[a.discipline].correct++
  }

  const sorted = Object.entries(byDisc)
    .filter(([, s]) => s.total >= 3)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)

  return sorted[0]?.[0]
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServerClient()
  let totalSent = 0
  const results: Record<number, { sent: number; skipped: number; errors: number }> = {}

  for (const day of DRIP_DAYS) {
    const targetDate = dateNDaysAgo(day)
    results[day] = { sent: 0, skipped: 0, errors: 0 }

    // Fetch users registered on the target date
    const { data: allProfiles } = await sb
      .from('user_profiles')
      .select('user_id, email, name')
      .gte('registered_at', targetDate + 'T00:00:00.000Z')
      .lt('registered_at', targetDate + 'T23:59:59.999Z')

    if (!allProfiles?.length) continue

    // Process in batches of BATCH_SIZE to avoid timeout
    for (let i = 0; i < allProfiles.length; i += BATCH_SIZE) {
      const batch = allProfiles.slice(i, i + BATCH_SIZE)

      for (const p of batch) {
        // Skip if already sent
        const { data: existing } = await sb
          .from('email_drip_log')
          .select('user_id')
          .eq('user_id', p.user_id)
          .eq('drip_day', day)
          .maybeSingle()

        if (existing) {
          results[day].skipped++
          continue
        }

        // Get weakest discipline for personalization
        const weak_disc = await getWeakDisc(sb, p.user_id)

        const ok = await sendDripEmail({
          email: p.email,
          name: p.name || '',
          drip_day: day,
          weak_disc,
        })

        if (ok) {
          await sb.from('email_drip_log').insert({ user_id: p.user_id, drip_day: day })
          results[day].sent++
          totalSent++
        } else {
          results[day].errors++
        }
      }
    }
  }

  // Piggyback: drip diário de indexação no Google (10 posts/dia em rotação).
  // Plano Hobby limita a 2 crons, então rodamos junto com o email-drip diário.
  let googleIndex: Awaited<ReturnType<typeof dripDailyGoogleIndex>> | { error: string } = { error: 'skipped' }
  try {
    googleIndex = await dripDailyGoogleIndex()
  } catch (e) {
    googleIndex = { error: e instanceof Error ? e.message : 'unknown' }
  }

  return NextResponse.json({ ok: true, totalSent, results, googleIndex })
}
