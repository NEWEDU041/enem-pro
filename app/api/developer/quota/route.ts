import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = createServerClient()

  try {
    // Get user's subscription tier
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('tier, created_at')
      .eq('id', auth.userId)
      .single()

    if (userError) throw userError

    // Calculate quota period (monthly)
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get usage for this month
    const { data: usage, error: usageError } = await supabase
      .rpc('get_user_api_usage', {
        user_id: auth.userId,
        start_date: periodStart.toISOString(),
        end_date: periodEnd.toISOString(),
      })

    if (usageError) throw usageError

    // Determine quota limits by tier
    const quotaLimits: Record<string, number> = {
      free: 1000,
      pro: 10000,
      enterprise: 1000000,
    }

    const tier = user?.tier || 'free'
    const quotaLimit = quotaLimits[tier] || 1000
    const quotaUsed = usage || 0

    return NextResponse.json({
      tier,
      quota_used: quotaUsed,
      quota_limit: quotaLimit,
      quota_remaining: Math.max(0, quotaLimit - quotaUsed),
      period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
      reset_at: periodEnd.toISOString(),
      percentage: Math.round((quotaUsed / quotaLimit) * 100),
    })
  } catch (error) {
    console.error('Quota fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quota information' },
      { status: 500 }
    )
  }
}
