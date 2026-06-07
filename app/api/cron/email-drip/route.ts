import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendDripEmail } from '@/lib/resend'
import { cleanEnv } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = cleanEnv(process.env.CRON_SECRET)
  // Always require auth; Vercel cron sends Authorization: Bearer <secret>
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createServerClient()
  let sent = 0

  for (const day of [3, 7, 14]) {
    const targetDate = dateNDaysAgo(day)

    const { data: profiles } = await sb
      .from('user_profiles')
      .select('user_id, email, name')
      .gte('registered_at', targetDate + 'T00:00:00.000Z')
      .lt('registered_at', targetDate + 'T23:59:59.999Z')

    if (!profiles?.length) continue

    for (const p of profiles) {
      const { data: existing } = await sb
        .from('email_drip_log')
        .select('user_id')
        .eq('user_id', p.user_id)
        .eq('drip_day', day)
        .maybeSingle()

      if (existing) continue

      // Find weakest discipline
      let weak_disc: string | undefined
      const { data: answers } = await sb
        .from('user_answers')
        .select('discipline, is_correct')
        .eq('user_id', p.user_id)
        .limit(200)

      if (answers?.length) {
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
        if (sorted[0]) weak_disc = sorted[0][0]
      }

      const ok = await sendDripEmail({ email: p.email, name: p.name || '', drip_day: day, weak_disc })
      if (ok) {
        await sb.from('email_drip_log').insert({ user_id: p.user_id, drip_day: day })
        sent++
      }
    }
  }

  return NextResponse.json({ ok: true, sent })
}
