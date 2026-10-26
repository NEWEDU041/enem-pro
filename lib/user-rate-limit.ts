/**
 * User-based Rate Limiting by Tier (Free/Pro)
 * Validates user tier via Supabase and enforces daily request limits
 * 
 * Free tier: 100 requests/day
 * Pro tier: 10,000 requests/day
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { getCached, setCached } from '@/lib/cache'

/**
 * Tier configuration with request limits
 */
export const TIER_CONFIG = {
  free: {
    name: 'Free',
    daily_limit: 100,
    hourly_limit: 20,
    burst_limit: 5, // Max requests in 1 minute
  },
  pro: {
    name: 'Pro',
    daily_limit: 10000,
    hourly_limit: 2000,
    burst_limit: 100, // Max requests in 1 minute
  },
} as const

export type Tier = keyof typeof TIER_CONFIG

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  ok: boolean
  remaining: number
  limit: number
  resetAt: Date
  retryAfterSeconds?: number
  tier?: Tier
  headers?: Record<string, string>
}

/**
 * Get user's subscription tier
 * L1: Redis cache (1h TTL)
 * L2: Supabase DB (then cache)
 */
export async function getUserTier(
  userId: string,
  supabase: SupabaseClient
): Promise<{ tier: Tier; expiresAt: Date | null }> {
  // L1 CACHE — Redis (fastest, 1h TTL)
  const cached = await getCached<{ tier: Tier; expiresAt: string | null }>(
    'user_tier',
    userId
  )
  if (cached) {
    return {
      tier: cached.tier,
      expiresAt: cached.expiresAt ? new Date(cached.expiresAt) : null,
    }
  }

  // L2 CACHE — Supabase DB
  const { data: sub, error } = await supabase
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[getUserTier] Supabase error:', error.message)
    // Default to free tier on error
    return { tier: 'free', expiresAt: null }
  }

  // Determine tier: pro only if plan='pro' AND subscription is active
  let tier: Tier = 'free'
  let expiresAt: Date | null = null

  if (sub?.plan === 'pro' && sub?.expires_at) {
    expiresAt = new Date(sub.expires_at)
    if (expiresAt > new Date()) {
      tier = 'pro'
    }
  }

  // Promote to Redis cache (async, non-blocking)
  setCached('user_tier', userId, {
    tier,
    expiresAt: expiresAt?.toISOString() ?? null,
  }).catch(e => {
    console.error('[getUserTier] Redis cache failed:', String(e))
  })

  return { tier, expiresAt }
}

/**
 * Get current daily usage for a user
 * L1: Redis cache (refreshed every 5 min)
 * L2: Supabase DB (then cache)
 * Tracks: daily requests, hourly requests, burst requests
 */
export async function getUserUsage(
  userId: string,
  supabase: SupabaseClient,
  date?: string
): Promise<{
  daily_count: number
  hourly_count: number
  burst_count: number
  last_request_at: Date | null
}> {
  const dateStr = date || new Date().toISOString().split('T')[0]

  // L1 CACHE — Redis (5min TTL for freshness)
  const cached = await getCached<{
    daily_count: number
    hourly_count: number
    burst_count: number
    last_request_at: string | null
  }>('user_usage', `${userId}:${dateStr}`)
  
  if (cached) {
    return {
      daily_count: cached.daily_count,
      hourly_count: cached.hourly_count,
      burst_count: cached.burst_count,
      last_request_at: cached.last_request_at ? new Date(cached.last_request_at) : null,
    }
  }

  // L2 CACHE — Supabase DB
  const { data: usage, error } = await supabase
    .from('user_rate_limit_counters')
    .select('daily_count, hourly_count, burst_count, last_request_at')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle()

  if (error) {
    console.error('[getUserUsage] Supabase error:', error.message)
    return {
      daily_count: 0,
      hourly_count: 0,
      burst_count: 0,
      last_request_at: null,
    }
  }

  const result = {
    daily_count: usage?.daily_count ?? 0,
    hourly_count: usage?.hourly_count ?? 0,
    burst_count: usage?.burst_count ?? 0,
    last_request_at: usage?.last_request_at ? new Date(usage.last_request_at) : null,
  }

  // Promote to Redis cache (async, non-blocking)
  setCached('user_usage', `${userId}:${dateStr}`, {
    ...result,
    last_request_at: result.last_request_at?.toISOString() ?? null,
  }).catch(e => {
    console.error('[getUserUsage] Redis cache failed:', String(e))
  })

  return result
}

/**
 * Check and enforce rate limit for a user
 * Returns 429 response headers if limit is exceeded
 */
export async function checkUserRateLimit(
  userId: string,
  supabase: SupabaseClient,
  endpoint?: string
): Promise<RateLimitResult> {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const hourStr = now.toISOString().slice(0, 13) // YYYY-MM-DDTHH

  try {
    // Get user tier
    const { tier } = await getUserTier(userId, supabase)
    const config = TIER_CONFIG[tier]

    // Get current usage
    const usage = await getUserUsage(userId, supabase, dateStr)

    // Check daily limit
    if (usage.daily_count >= config.daily_limit) {
      const resetAt = new Date(dateStr)
      resetAt.setDate(resetAt.getDate() + 1)
      resetAt.setHours(0, 0, 0, 0)

      return {
        ok: false,
        remaining: 0,
        limit: config.daily_limit,
        resetAt,
        retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        tier,
        headers: {
          'X-RateLimit-Limit': String(config.daily_limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
          'X-RateLimit-Tier': tier,
          'Retry-After': String(Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
        },
      }
    }

    // Check hourly limit
    if (usage.hourly_count >= config.hourly_limit) {
      const resetAt = new Date(hourStr + ':59:59Z')
      resetAt.setHours(resetAt.getHours() + 1, 0, 0, 0)

      return {
        ok: false,
        remaining: 0,
        limit: config.hourly_limit,
        resetAt,
        retryAfterSeconds: Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
        tier,
        headers: {
          'X-RateLimit-Limit': String(config.hourly_limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
          'X-RateLimit-Tier': tier,
          'Retry-After': String(Math.ceil((resetAt.getTime() - now.getTime()) / 1000)),
        },
      }
    }

    // Check burst limit (1 minute window)
    if (usage.burst_count >= config.burst_limit) {
      const resetAt = new Date(now.getTime() + 60_000) // +1 minute

      return {
        ok: false,
        remaining: 0,
        limit: config.burst_limit,
        resetAt,
        retryAfterSeconds: 60,
        tier,
        headers: {
          'X-RateLimit-Limit': String(config.burst_limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetAt.toISOString(),
          'X-RateLimit-Tier': tier,
          'Retry-After': '60',
        },
      }
    }

    // Increment counters in DB
    await incrementRateLimitCounters(userId, supabase, dateStr, hourStr)

    // Calculate remaining
    const remaining = Math.max(
      0,
      config.daily_limit - (usage.daily_count + 1)
    )

    const resetAt = new Date(dateStr)
    resetAt.setDate(resetAt.getDate() + 1)
    resetAt.setHours(0, 0, 0, 0)

    return {
      ok: true,
      remaining,
      limit: config.daily_limit,
      resetAt,
      tier,
      headers: {
        'X-RateLimit-Limit': String(config.daily_limit),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': resetAt.toISOString(),
        'X-RateLimit-Tier': tier,
      },
    }
  } catch (error) {
    console.error('[checkUserRateLimit] Unexpected error:', error)
    // Fail open: allow request if checking fails
    return {
      ok: true,
      remaining: -1,
      limit: -1,
      resetAt: new Date(),
      tier: 'free',
    }
  }
}

/**
 * Increment rate limit counters
 * Uses RPC for atomic operation (avoid race conditions)
 */
async function incrementRateLimitCounters(
  userId: string,
  supabase: SupabaseClient,
  dateStr: string,
  hourStr: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_rate_limit_counters', {
      p_user_id: userId,
      p_date: dateStr,
      p_hour: hourStr,
    })

    if (error) {
      console.error('[incrementRateLimitCounters] RPC error:', error.message)
      // Fallback to direct upsert
      const now = new Date().toISOString()
      await supabase.from('user_rate_limit_counters').upsert(
        {
          user_id: userId,
          date: dateStr,
          daily_count: 1,
          hourly_count: 1,
          burst_count: 1,
          last_request_at: now,
        },
        { onConflict: 'user_id,date' }
      )
    }
  } catch (error) {
    console.error('[incrementRateLimitCounters] Unexpected error:', error)
  }
}

/**
 * Reset daily counters for a user (for testing or admin)
 */
export async function resetUserDailyCounters(
  userId: string,
  supabase: SupabaseClient,
  date?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const dateStr = date || new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('user_rate_limit_counters')
      .delete()
      .eq('user_id', userId)
      .eq('date', dateStr)

    if (error) {
      return { ok: false, error: error.message }
    }

    // Invalidate cache
    await getCached('user_usage', `${userId}:${dateStr}`)

    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

/**
 * Get user tier statistics for dashboard
 */
export async function getUserTierStats(
  userId: string,
  supabase: SupabaseClient
): Promise<{
  tier: Tier
  expiresAt: Date | null
  daily_limit: number
  requests_today: number
  percent_used: number
}> {
  const { tier, expiresAt } = await getUserTier(userId, supabase)
  const config = TIER_CONFIG[tier]
  const usage = await getUserUsage(userId, supabase)

  return {
    tier,
    expiresAt,
    daily_limit: config.daily_limit,
    requests_today: usage.daily_count,
    percent_used: Math.round((usage.daily_count / config.daily_limit) * 100),
  }
}
