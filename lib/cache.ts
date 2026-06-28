// User subscription cache
// Pattern: cache:user:{userId}:subscription
// TTL: 5 minutes

import { createServerClient } from './supabase'

export interface CachedSubscription {
  plan: 'pro' | 'free'
  expires_at: string
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// In-memory cache (suitable for serverless, cleared per request)
const memoryCache = new Map<string, { data: CachedSubscription; expiresAt: number }>()

export async function getOrFetchSubscription(userId: string): Promise<CachedSubscription | null> {
  const cacheKey = `user:${userId}:subscription`

  // Check in-memory cache
  const cached = memoryCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  // Fetch from Supabase
  const sb = createServerClient()
  const { data, error } = await sb
    .from('subscriptions')
    .select('plan, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const subscription: CachedSubscription = {
    plan: data.plan === 'pro' ? 'pro' : 'free',
    expires_at: data.expires_at,
  }

  // Store in memory cache
  memoryCache.set(cacheKey, {
    data: subscription,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return subscription
}

export function clearSubscriptionCache(userId: string) {
  const cacheKey = `user:${userId}:subscription`
  memoryCache.delete(cacheKey)
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key)
    }
  }
}, 60000) // Every minute
