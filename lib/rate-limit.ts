import { createServerClient } from '@/lib/supabase'

const FREE_DAILY_EXPLANATION_LIMIT = 10

export async function checkRateLimit(
  userId: string,
  supabase: ReturnType<typeof createServerClient>,
  userIsPro: boolean
): Promise<{ ok: boolean; retryAfterMs: number }> {
  if (userIsPro) return { ok: true, retryAfterMs: 0 }

  const today = new Date().toISOString().split('T')[0]
  const { data: usage } = await supabase
    .from('daily_usage')
    .select('explanation_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  const usedToday = usage?.explanation_count ?? 0
  if (usedToday >= FREE_DAILY_EXPLANATION_LIMIT) {
    // Retry at midnight UTC
    const now = new Date()
    const midnight = new Date(now)
    midnight.setUTCDate(midnight.getUTCDate() + 1)
    midnight.setUTCHours(0, 0, 0, 0)
    return { ok: false, retryAfterMs: midnight.getTime() - now.getTime() }
  }

  return { ok: true, retryAfterMs: 0 }
}
