/**
 * Redis initialization middleware
 * 
 * This middleware initializes the Redis client on app startup.
 * Should be imported in Next.js app root layout or a middleware file.
 * 
 * Usage in layout.tsx:
 * import { initRedisClient } from '@/lib/redis-init'
 * 
 * // Call before any routes access Redis
 * await initRedisClient()
 */

import { initRedis, isRedisReady, getRedisClient } from './cache'
import logger from './logger'

let initialized = false

export async function initRedisClient() {
  if (initialized) {
    return
  }

  try {
    const client = initRedis()
    
    // Give Redis a moment to connect
    await new Promise(resolve => setTimeout(resolve, 500))
    
    if (isRedisReady()) {
      logger.info({
        label: 'redis_initialized',
        status: 'connected',
        url: process.env.REDIS_URL || 'redis://localhost:6379/0',
      })
    } else {
      logger.warn({
        label: 'redis_initialization',
        status: 'pending',
        message: 'Redis client created but not yet connected',
      })
    }

    initialized = true
  } catch (error) {
    logger.error({
      err: error,
      label: 'redis_initialization_failed',
      message: 'Failed to initialize Redis client',
    })
    // Non-blocking error — app should still work with cache layer
    initialized = true
  }
}

export async function getRedisStatus() {
  const client = getRedisClient()
  
  if (!client) {
    return {
      connected: false,
      message: 'Redis client not initialized',
    }
  }

  try {
    const pong = await client.ping()
    return {
      connected: pong === 'PONG',
      message: 'Redis is healthy',
    }
  } catch (error) {
    return {
      connected: false,
      message: `Redis error: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Health check endpoint data
 * Use in /api/health or similar endpoint
 */
export async function getRedisHealthCheck() {
  const status = await getRedisStatus()
  
  return {
    name: 'redis',
    status: status.connected ? 'up' : 'down',
    message: status.message,
    timestamp: new Date().toISOString(),
  }
}
