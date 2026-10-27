/**
 * Database Connection Pool Manager for Supabase PostgreSQL
 * Uses pg-pool for optimized connection pooling with configurable limits
 * 
 * Features:
 * - Connection pooling (max: 20 connections, idle timeout: 30s)
 * - Automatic connection reuse and cleanup
 * - Query timeout configuration
 * - Connection health checks
 * - Metrics tracking for monitoring
 */

import { Pool, PoolClient, QueryResult } from 'pg'
import { cleanEnv } from './utils'

interface PoolConfig {
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
  maxUses: number
}

interface PoolMetrics {
  totalConnections: number
  idleConnections: number
  waitingRequests: number
  totalQueries: number
  totalDuration: number
  avgDurationMs: number
}

interface QueryMetrics {
  query: string
  durationMs: number
  timestamp: Date
  rowCount: number
}

let _pool: Pool | null = null
const queryMetrics: QueryMetrics[] = []
const MAX_METRICS_HISTORY = 1000

/**
 * Get or initialize the connection pool
 * Uses DATABASE_URL environment variable (Supabase PostgreSQL direct connection)
 */
function getPool(): Pool {
  if (_pool) {
    return _pool
  }

  const databaseUrl = cleanEnv(process.env.DATABASE_URL)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set')
  }

  const config: PoolConfig = {
    max: 20, // Maximum concurrent connections
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds to acquire a connection
    maxUses: 7920, // ~10 hours per connection
  }

  _pool = new Pool({
    connectionString: databaseUrl,
    ...config,
    // Extra safety: reject query after 15 seconds
    queryTimeoutMillis: 15000,
  })

  // Error handler for pool-level issues
  _pool.on('error', (err) => {
    console.error('[db-pool] Unexpected error on idle client:', err)
  })

  // Log pool events in development
  if (process.env.NODE_ENV === 'development') {
    _pool.on('connect', () => {
      console.log('[db-pool] New connection established')
    })
  }

  return _pool
}

/**
 * Execute a query using the connection pool
 * Tracks query metrics for monitoring
 * 
 * @param query SQL query string
 * @param values Query parameters
 * @returns Query result
 */
export async function query<T = any>(
  query: string,
  values?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool()
  const startTime = Date.now()

  try {
    const result = await pool.query<T>(query, values)
    const durationMs = Date.now() - startTime

    // Track metrics
    trackMetric(query, durationMs, result.rowCount || 0)

    // Log slow queries
    if (durationMs > 1000) {
      console.warn(
        `[db-pool] Slow query (${durationMs}ms):`,
        query.substring(0, 80)
      )
    }

    return result
  } catch (error) {
    const durationMs = Date.now() - startTime
    console.error(
      `[db-pool] Query error after ${durationMs}ms:`,
      (error as Error).message
    )
    throw error
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * Acquires a client from the pool and manages the transaction lifecycle
 * 
 * @param callback Function to execute within the transaction
 * @returns Result from the callback
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Batch execute multiple queries sequentially
 * Useful for bulk operations
 * 
 * @param queries Array of { text, values }
 * @returns Array of results
 */
export async function batch(
  queries: Array<{ text: string; values?: any[] }>
): Promise<QueryResult[]> {
  const results: QueryResult[] = []

  for (const q of queries) {
    const result = await query(q.text, q.values)
    results.push(result)
  }

  return results
}

/**
 * Execute a query and return the first row
 * 
 * @param queryStr SQL query string
 * @param values Query parameters
 * @returns First row or null
 */
export async function queryOne<T = any>(
  queryStr: string,
  values?: any[]
): Promise<T | null> {
  const result = await query<T>(queryStr, values)
  return result.rows[0] || null
}

/**
 * Execute a query and return all rows
 * 
 * @param queryStr SQL query string
 * @param values Query parameters
 * @returns Array of rows
 */
export async function queryAll<T = any>(
  queryStr: string,
  values?: any[]
): Promise<T[]> {
  const result = await query<T>(queryStr, values)
  return result.rows
}

/**
 * Get current pool metrics
 * Useful for monitoring and diagnostics
 */
export function getMetrics(): PoolMetrics & { recentQueries: QueryMetrics[] } {
  const pool = getPool()
  const totalDuration = queryMetrics.reduce((sum, m) => sum + m.durationMs, 0)

  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
    totalQueries: queryMetrics.length,
    totalDuration,
    avgDurationMs:
      queryMetrics.length > 0
        ? Math.round(totalDuration / queryMetrics.length)
        : 0,
    recentQueries: queryMetrics.slice(-10), // Last 10 queries
  }
}

/**
 * Reset pool metrics (useful for benchmarking)
 */
export function resetMetrics(): void {
  queryMetrics.length = 0
}

/**
 * Track query metrics
 * @internal
 */
function trackMetric(query: string, durationMs: number, rowCount: number): void {
  queryMetrics.push({
    query: query.substring(0, 200), // Store first 200 chars only
    durationMs,
    timestamp: new Date(),
    rowCount,
  })

  // Trim history to avoid memory leak
  if (queryMetrics.length > MAX_METRICS_HISTORY) {
    queryMetrics.splice(0, queryMetrics.length - MAX_METRICS_HISTORY)
  }
}

/**
 * Gracefully close all connections in the pool
 * Call this during application shutdown
 */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end()
    _pool = null
    console.log('[db-pool] Connection pool closed')
  }
}

/**
 * Health check: verify the pool can acquire and release connections
 * Returns true if healthy, false otherwise
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const pool = getPool()
    const client = await Promise.race([
      pool.connect(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      ),
    ])

    if (!client) return false
    await (client as PoolClient).query('SELECT 1')
    ;(client as PoolClient).release()
    return true
  } catch (error) {
    console.error('[db-pool] Health check failed:', (error as Error).message)
    return false
  }
}

/**
 * Get pool statistics
 * Useful for monitoring in production
 */
export function getPoolStats() {
  const pool = getPool()
  return {
    size: pool.totalCount,
    available: pool.idleCount,
    inUse: pool.totalCount - pool.idleCount,
    waiting: pool.waitingCount,
    max: pool._maxPool || 20,
  }
}
