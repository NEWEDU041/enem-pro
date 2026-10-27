import Redis from 'ioredis'
import logger from './logger'

// === TYPES ===

export type CacheType = 'question' | 'explanation' | 'user_context' | 'stripe_customer' | 'stripe_price'

interface CacheConfig {
  type: CacheType
  ttl: number // seconds
  namespace: string
}

const CACHE_CONFIGS: Record<CacheType, CacheConfig> = {
  question: { type: 'question', ttl: 86400, namespace: 'q' }, // 24h
  explanation: { type: 'explanation', ttl: 86400, namespace: 'exp' }, // 24h (updated from 12h for aggressive caching)
  user_context: { type: 'user_context', ttl: 3600, namespace: 'ctx' }, // 1h
  stripe_customer: { type: 'stripe_customer', ttl: 3600, namespace: 'stripe_cust' }, // 1h
  stripe_price: { type: 'stripe_price', ttl: 86400, namespace: 'stripe_price' }, // 24h
}

// === PROMETHEUS METRICS ===

interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  errors: number
  invalidations: number
  totalLatency: number
  requestCount: number
}

const metrics: Record<string, CacheMetrics> = {
  explanation: { hits: 0, misses: 0, sets: 0, errors: 0, invalidations: 0, totalLatency: 0, requestCount: 0 },
  question: { hits: 0, misses: 0, sets: 0, errors: 0, invalidations: 0, totalLatency: 0, requestCount: 0 },
  user_context: { hits: 0, misses: 0, sets: 0, errors: 0, invalidations: 0, totalLatency: 0, requestCount: 0 },
  stripe_customer: { hits: 0, misses: 0, sets: 0, errors: 0, invalidations: 0, totalLatency: 0, requestCount: 0 },
  stripe_price: { hits: 0, misses: 0, sets: 0, errors: 0, invalidations: 0, totalLatency: 0, requestCount: 0 },
}

export function getMetrics(type?: CacheType) {
  if (!type) return metrics
  return metrics[type] || null
}

export function getHitRate(type: CacheType): number {
  const m = metrics[type]
  const total = m.hits + m.misses
  return total === 0 ? 0 : (m.hits / total) * 100
}

// === SINGLETON REDIS CLIENT ===

let redisClient: Redis | null = null
let initialized = false

export function initRedis(): Redis {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0'
  
  try {
    redisClient = new Redis(redisUrl, {
      enableReadyCheck: false,
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redisClient.on('error', (err) => {
      logger.error({ err, label: 'Redis connection error' })
    })

    redisClient.on('connect', () => {
      logger.info({ label: 'Redis connected' })
      initialized = true
    })

    return redisClient
  } catch (e) {
    logger.error({ err: e, label: 'Redis init failed' })
    throw e
  }
}

export function getRedisClient(): Redis | null {
  if (!redisClient) {
    try {
      initRedis()
    } catch {
      return null
    }
  }
  return redisClient
}

export function isRedisReady(): boolean {
  return initialized && redisClient !== null
}

// === CACHE OPERATIONS ===

/**
 * Build cache key from type + id
 */
function buildKey(type: CacheType, id: string): string {
  const config = CACHE_CONFIGS[type]
  return `enem:${config.namespace}:${id}`
}

/**
 * Get value from cache
 */
export async function getCached<T>(
  type: CacheType,
  id: string
): Promise<T | null> {
  const client = getRedisClient()
  if (!client || !isRedisReady()) {
    return null
  }

  const startTime = performance.now()

  try {
    const key = buildKey(type, id)
    const data = await client.get(key)
    const latency = performance.now() - startTime

    if (data) {
      metrics[type].hits++
      metrics[type].totalLatency += latency
      metrics[type].requestCount++
      
      logger.debug({
        label: 'cache_hit',
        type,
        id,
        key,
        latency_ms: Math.round(latency),
      })
      return JSON.parse(data) as T
    }

    metrics[type].misses++
    metrics[type].totalLatency += latency
    metrics[type].requestCount++
    
    logger.debug({
      label: 'cache_miss',
      type,
      id,
    })
    return null
  } catch (e) {
    metrics[type].errors++
    logger.warn({
      err: e,
      label: 'cache_get_error',
      type,
      id,
    })
    return null
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  type: CacheType,
  id: string,
  value: T
): Promise<boolean> {
  const client = getRedisClient()
  if (!client || !isRedisReady()) {
    return false
  }

  try {
    const key = buildKey(type, id)
    const config = CACHE_CONFIGS[type]
    const serialized = JSON.stringify(value)

    await client.setex(key, config.ttl, serialized)
    metrics[type].sets++

    logger.debug({
      label: 'cache_set',
      type,
      id,
      key,
      ttl: config.ttl,
    })

    return true
  } catch (e) {
    metrics[type].errors++
    logger.warn({
      err: e,
      label: 'cache_set_error',
      type,
      id,
    })
    return false
  }
}

/**
 * Delete from cache
 */
export async function invalidateCache(
  type: CacheType,
  id: string
): Promise<boolean> {
  const client = getRedisClient()
  if (!client || !isRedisReady()) {
    return false
  }

  try {
    const key = buildKey(type, id)
    const deleted = await client.del(key)
    metrics[type].invalidations++

    logger.debug({
      label: 'cache_invalidate',
      type,
      id,
      key,
      deleted: deleted === 1,
    })

    return deleted === 1
  } catch (e) {
    metrics[type].errors++
    logger.warn({
      err: e,
      label: 'cache_invalidate_error',
      type,
      id,
    })
    return false
  }
}

/**
 * Batch invalidate multiple keys
 */
export async function invalidateCacheBatch(
  invalidations: Array<{ type: CacheType; id: string }>
): Promise<number> {
  const client = getRedisClient()
  if (!client || !isRedisReady()) {
    return 0
  }

  try {
    const keys = invalidations.map(({ type, id }) => buildKey(type, id))
    const deleted = await client.del(...keys)

    invalidations.forEach(({ type }) => {
      metrics[type].invalidations++
    })

    logger.debug({
      label: 'cache_invalidate_batch',
      count: invalidations.length,
      deleted,
    })

    return deleted
  } catch (e) {
    invalidations.forEach(({ type }) => {
      metrics[type].errors++
    })
    logger.warn({
      err: e,
      label: 'cache_invalidate_batch_error',
      count: invalidations.length,
    })
    return 0
  }
}

/**
 * Get-Or-Fetch pattern: try cache, fallback to getter, then cache result
 */
export async function getOrFetch<T>(
  type: CacheType,
  id: string,
  getter: () => Promise<T | null>
): Promise<T | null> {
  // Try cache first
  const cached = await getCached<T>(type, id)
  if (cached) {
    return cached
  }

  // Cache miss — fetch
  const fresh = await getter()
  if (fresh) {
    // Async cache write (non-blocking)
    setCached(type, id, fresh).catch((e) => {
      logger.warn({ err: e, label: 'cache_set_failed_after_fetch', type, id })
    })
  }

  return fresh
}

/**
 * Clear all cache (dangerous — use for testing only)
 */
export async function clearAllCache(): Promise<void> {
  const client = getRedisClient()
  if (!client || !isRedisReady()) {
    return
  }

  try {
    await client.flushdb()
    logger.warn({ label: 'cache_flush_all' })
  } catch (e) {
    logger.error({ err: e, label: 'cache_flush_error' })
  }
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
  connected: boolean
  info?: string
} | null> {
  const client = getRedisClient()
  if (!client) {
    return null
  }

  try {
    const info = await client.info('stats')
    return {
      connected: isRedisReady(),
      info,
    }
  } catch (e) {
    logger.error({ err: e, label: 'cache_stats_error' })
    return null
  }
}
