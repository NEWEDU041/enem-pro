import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { sendDripEmail } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { user_id, email, name, drip_day, weak_disc } = await req.json()
  if (!user_id || !email || drip_day === undefined) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const sb = createServerClient()

  const { data: existing } = await sb
    .from('email_drip_log')
    .select('user_id')
    .eq('user_id', user_id)
    .eq('drip_day', drip_day)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: true })

  const sent = await sendDripEmail({ email, name: name || '', drip_day, weak_disc })

  if (sent) {
    await sb.from('email_drip_log').insert({ user_id, drip_day })
  }

  return NextResponse.json({ ok: sent })
}
