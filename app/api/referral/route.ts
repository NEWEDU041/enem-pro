import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { withErrorHandling } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

function makeCode(userId: string, attempt = 0): string {
  const base = userId.replace(/-/g, '')
  // shift start offset on collision retry
  const start = (attempt * 4) % (base.length - 8)
  return (base.slice(start, start + 8) + base.slice(0, attempt)).slice(0, 8).toUpperCase()
}

// GET /api/referral — get or generate referral code + stats (requires auth)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const sb = createServerClient()

  // Get or create referral_code in subscriptions
  const { data: sub } = await sb
    .from('subscriptions')
    .select('referral_code')
    .eq('user_id', userId)
    .maybeSingle()

  let code = sub?.referral_code
  if (!code) {
    code = makeCode(userId)
    await sb.from('subscriptions').update({ referral_code: code }).eq('user_id', userId)
  }

  const { count } = await sb
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', userId)

  return NextResponse.json({ code, total: count || 0 })
})

// POST /api/referral — register referral + reward referrer
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { ref_code, referred_user_id } = await req.json()
  if (!ref_code || !referred_user_id) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const sb = createServerClient()

  // Find referrer
  const { data: refSub } = await sb
    .from('subscriptions')
    .select('user_id, plan, expires_at')
    .eq('referral_code', ref_code)
    .maybeSingle()

  if (!refSub) return NextResponse.json({ ok: false, reason: 'code not found' })
  if (refSub.user_id === referred_user_id) return NextResponse.json({ ok: false, reason: 'self-referral' })

  // Check already registered
  const { data: existing } = await sb
    .from('referrals')
    .select('referrer_id')
    .eq('referred_id', referred_user_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ ok: true, skipped: true })

  // Register referral
  await sb.from('referrals').insert({ referrer_id: refSub.user_id, referred_id: referred_user_id })

  // Reward referrer: +7 days Pro
  const currentExpiry = refSub.expires_at ? new Date(refSub.expires_at) : new Date()
  const base = currentExpiry > new Date() ? currentExpiry : new Date()
  base.setDate(base.getDate() + 7)

  await sb.from('subscriptions').upsert(
    {
      user_id: refSub.user_id,
      plan: 'pro',
      expires_at: base.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ ok: true })
})
