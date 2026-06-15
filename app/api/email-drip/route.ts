import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { sendDripEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await req.json()
  const { drip_day, weak_disc } = body
  if (drip_day === undefined) {
    return NextResponse.json({ error: 'Missing drip_day' }, { status: 400 })
  }

  const sb = createServerClient()

  const { data: existing } = await sb
    .from('email_drip_log')
    .select('user_id')
    .eq('user_id', userId)
    .eq('drip_day', drip_day)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: true })

  const { data: profile } = await sb
    .from('user_profiles')
    .select('email, name')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile?.email) return NextResponse.json({ ok: false, reason: 'profile not found' })

  const sent = await sendDripEmail({ email: profile.email, name: profile.name || '', drip_day, weak_disc })

  if (sent) {
    await sb.from('email_drip_log').insert({ user_id: userId, drip_day })
  }

  return NextResponse.json({ ok: sent })
}
