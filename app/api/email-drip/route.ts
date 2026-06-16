import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { sendDripEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

const VALID_DRIP_DAYS = [0, 1, 3, 7, 14, 21, 30]

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await req.json()
  const { drip_day } = body
  if (drip_day === undefined || !VALID_DRIP_DAYS.includes(drip_day)) {
    return NextResponse.json({ error: 'Invalid or missing drip_day' }, { status: 400 })
  }

  const sb = createServerClient()

  // Check if already sent
  const { data: existing } = await sb
    .from('email_drip_log')
    .select('user_id')
    .eq('user_id', userId)
    .eq('drip_day', drip_day)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: true })

  // Fetch user profile
  const { data: profile } = await sb
    .from('user_profiles')
    .select('email, name')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile?.email) return NextResponse.json({ ok: false, reason: 'profile not found' })

  // Auto-detect weakest discipline from user_answers
  let weak_disc: string | undefined
  const { data: answers } = await sb
    .from('user_answers')
    .select('discipline, is_correct')
    .eq('user_id', userId)
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

  const sent = await sendDripEmail({
    email: profile.email,
    name: profile.name || '',
    drip_day,
    weak_disc,
  })

  if (sent) {
    await sb.from('email_drip_log').insert({ user_id: userId, drip_day })
  }

  return NextResponse.json({ ok: sent })
}
