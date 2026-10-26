/**
 * Query Cache: Redis-backed cache for frequently accessed queries
 * 
 * Pattern: Top N queries cached with TTL (1 hour default)
 * Use case: Store explanation lookups, API responses, etc.
 * 
 * Metrics tracked:
 * - Hit rate %
 * - Miss rate %
 * - Cache size (entries)
 * - TTL efficiency
 */

import { Redis } from 'ioredis'

export interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  hitRate: number // 0-100
  totalEntries: number
}

export class QueryCache {
  private redis: Redis | null = null
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    hitRate: 0,
    totalEntries: 0,
  }
  private readonly prefix = 'query-cache:'
  private readonly defaultTTL = 3600 // 1 hour in seconds
  private readonly maxEntries = 50

  constructor(redisInstance?: Redis) {
    this.redis = redisInstance || null
  }

  /**
   * Initialize Redis connection if not provided
   */
  async init(redisUrl?: string): Promise<void> {
    if (this.redis) return

    try {
      this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://127.0.0.1:6379')
      await this.redis.ping()
      console.log('[QueryCache] Redis connected')
    } catch (err) {
      console.error('[QueryCache] Redis initialization failed:', err)
      this.redis = null // Graceful degradation
    }
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(namespace: string, id: string): string {
    return `${this.prefix}${namespace}:${id}`
  }

  /**
   * Get cached value
   */
  async get<T>(namespace: string, id: string): Promise<T | null> {
    if (!this.redis) {
      this.metrics.misses++
      return null
    }

    try {
      const key = this.generateKey(namespace, id)
      const cached = await this.redis.get(key)

      if (cached) {
        this.metrics.hits++
        this.updateHitRate()
        return JSON.parse(cached) as T
      }

      this.metrics.misses++
      this.updateHitRate()
      return null
    } catch (err) {
      console.error('[QueryCache] Get error:', err)
      this.metrics.misses++
      return null
    }
  }

  /**
   * Set cached value with TTL
   */
  async set<T>(
    namespace: string,
    id: string,
    value: T,
    ttl: number = this.defaultTTL
  ): Promise<boolean> {
    if (!this.redis) return false

    try {
      const key = this.generateKey(namespace, id)
      const json = JSON.stringify(value)

      // Check if we're at capacity and need to evict
      const currentSize = await this.getSize()
      if (currentSize >= this.maxEntries) {
        // Evict oldest entry
        await this.evictOldest()
        this.metrics.evictions++
      }

      await this.redis.setex(key, ttl, json)
      this.metrics.totalEntries = await this.getSize()
      return true
    } catch (err) {
      console.error('[QueryCache] Set error:', err)
      return false
    }
  }

  /**
   * Delete cached value
   */
  async delete(namespace: string, id: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const key = this.generateKey(namespace, id)
      const deleted = await this.redis.del(key)
      return deleted > 0
    } catch (err) {
      console.error('[QueryCache] Delete error:', err)
      return false
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys(`${this.prefix}*`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      this.metrics = {
        hits: 0,
        misses: 0,
        evictions: 0,
        hitRate: 0,
        totalEntries: 0,
      }
    } catch (err) {
      console.error('[QueryCache] Clear error:', err)
    }
  }

  /**
   * Get cache size
   */
  private async getSize(): Promise<number> {
    if (!this.redis) return 0

    try {
      const keys = await this.redis.keys(`${this.prefix}*`)
      return keys.length
    } catch {
      return 0
    }
  }

  /**
   * Evict oldest entry (FIFO)
   */
  private async evictOldest(): Promise<void> {
    if (!this.redis) return

    try {
      const keys = await this.redis.keys(`${this.prefix}*`)
      if (keys.length > 0) {
        // Get the first key (oldest by scan order) and delete it
        await this.redis.del(keys[0])
      }
    } catch (err) {
      console.error('[QueryCache] Evict error:', err)
    }
  }

  /**
   * Update hit rate percentage
   */
  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0
  }

  /**
   * Get metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      hitRate: 0,
      totalEntries: 0,
    }
  }

  /**
   * Get cache statistics for logging
   */
  getStats(): string {
    return (
      `[QueryCache] Hits=${this.metrics.hits} Misses=${this.metrics.misses} ` +
      `HitRate=${this.metrics.hitRate.toFixed(1)}% Entries=${this.metrics.totalEntries}/${this.maxEntries}`
    )
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
  }
}

/**
 * Singleton instance
 */
let queryCache: QueryCache | null = null

export async function getQueryCache(): Promise<QueryCache> {
  if (!queryCache) {
    queryCache = new QueryCache()
    await queryCache.init()
  }
  return queryCache
}

export function getQueryCacheSync(): QueryCache {
  if (!queryCache) {
    queryCache = new QueryCache()
    // Init called async elsewhere
  }
  return queryCache
}
