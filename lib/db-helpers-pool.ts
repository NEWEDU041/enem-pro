/**
 * Database Query Optimizer Helpers
 * Provides utility functions to migrate from Supabase client to optimized pool queries
 * 
 * Migration approach:
 * 1. For read operations: Migrate from supabase.from().select() to db-pool queries
 * 2. For write operations: Use transactions from db-pool for ACID compliance
 * 3. For batch operations: Use batch() helper to reduce round-trips
 */

import * as dbPool from './db-pool'

/**
 * Migrate user subscription lookup from Supabase to direct pool
 * Used by: /api/portal, /api/explicar
 */
export async function getUserSubscription(userId: string) {
  const query = `
    SELECT id, user_id, plan, stripe_subscription_id, expires_at, created_at
    FROM subscriptions
    WHERE user_id = $1
    LIMIT 1
  `
  return dbPool.queryOne(query, [userId])
}

/**
 * Migrate daily usage lookup from Supabase to direct pool
 * Used by: /api/user-rate-limit
 */
export async function getDailyUsage(userId: string, date: string) {
  const query = `
    SELECT id, user_id, date, explanation_count, created_at
    FROM daily_usage
    WHERE user_id = $1 AND date = $2
    LIMIT 1
  `
  return dbPool.queryOne(query, [userId, date])
}

/**
 * Migrate user response history lookup from Supabase to direct pool
 * Used by: /api/portal (fetch user's quiz responses)
 * 
 * Note: This is a critical N+1 query pattern - index on (user_id, created_at) is essential
 */
export async function getUserResponses(
  userId: string,
  limit: number = 50,
  offset: number = 0
) {
  const query = `
    SELECT id, user_id, question_id, answer, is_correct, created_at
    FROM usuario_respostas
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `
  return dbPool.queryAll(query, [userId, limit, offset])
}

/**
 * Migrate checkout log lookup from Supabase to direct pool
 * Used by: /api/checkout
 */
export async function getCheckoutLogs(
  userId: string,
  status?: string,
  limit: number = 20
) {
  let query = `
    SELECT id, user_id, stripe_session_id, status, created_at, amount
    FROM checkout_logs
    WHERE user_id = $1
  `
  const params: any[] = [userId]

  if (status) {
    query += ` AND status = $2`
    params.push(status)
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`
  params.push(limit)

  return dbPool.queryAll(query, params)
}

/**
 * Migrate question explanation lookup from Supabase to direct pool
 * Used by: /api/questoes/[id]
 * 
 * Note: Index on question_explanations(question_id) is essential
 */
export async function getExplanation(questionId: string) {
  const query = `
    SELECT id, question_id, explanation, model, created_at
    FROM question_explanations
    WHERE question_id = $1
    LIMIT 1
  `
  return dbPool.queryOne(query, [questionId])
}

/**
 * Migrate batch explanation lookup from Supabase to direct pool
 * Used by: Batch explanation fetches, bulk operations
 * 
 * Significantly faster than N individual lookups
 */
export async function getExplanationBatch(questionIds: string[]) {
  if (questionIds.length === 0) {
    return []
  }

  const placeholders = questionIds.map((_, i) => `$${i + 1}`).join(',')
  const query = `
    SELECT id, question_id, explanation, model, created_at
    FROM question_explanations
    WHERE question_id = ANY($1)
  `
  return dbPool.queryAll(query, [questionIds])
}

/**
 * Migrate audit log lookup from Supabase to direct pool
 * Used by: /api/admin/audit-logs
 */
export async function getAuditLogs(
  userId?: string,
  limit: number = 100,
  offset: number = 0
) {
  let query = `
    SELECT id, user_id, action, resource, details, ip_address, created_at
    FROM audit_logs
  `
  const params: any[] = []

  if (userId) {
    query += ` WHERE user_id = $${params.length + 1}`
    params.push(userId)
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
    params.length + 2
  }`
  params.push(limit, offset)

  return dbPool.queryAll(query, params)
}

/**
 * Migrate user rate limit check from Supabase to direct pool
 * Used by: checkUserRateLimit middleware
 * 
 * Returns usage count for the given date
 */
export async function checkRateLimit(userId: string, date: string) {
  const query = `
    SELECT COALESCE(explanation_count, 0) as count
    FROM daily_usage
    WHERE user_id = $1 AND date = $2
    LIMIT 1
  `
  const result = await dbPool.queryOne<{ count: number }>(query, [userId, date])
  return result?.count || 0
}

/**
 * Migrate increment daily usage from Supabase to direct pool
 * Used by: /api/explicar (increase usage after explanation)
 */
export async function incrementDailyUsage(
  userId: string,
  date: string,
  increment: number = 1
) {
  const query = `
    INSERT INTO daily_usage (user_id, date, explanation_count)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, date) DO UPDATE
    SET explanation_count = daily_usage.explanation_count + $3
    RETURNING explanation_count
  `
  const result = await dbPool.queryOne<{ explanation_count: number }>(
    query,
    [userId, date, increment]
  )
  return result?.explanation_count || 0
}

/**
 * Migrate newsletter subscriber lookup from Supabase to direct pool
 * Used by: /api/newsletter, /api/email-drip
 */
export async function getNewsletterSubscribers(
  status: string = 'active',
  limit: number = 100
) {
  const query = `
    SELECT id, email, status, created_at
    FROM newsletter_subscribers
    WHERE status = $1
    ORDER BY created_at DESC
    LIMIT $2
  `
  return dbPool.queryAll(query, [status, limit])
}

/**
 * Migrate user profile lookup from Supabase to direct pool
 * Used by: Multiple endpoints
 */
export async function getUserProfile(userId: string) {
  const query = `
    SELECT id, email, name, registered_at
    FROM user_profiles
    WHERE id = $1
    LIMIT 1
  `
  return dbPool.queryOne(query, [userId])
}

/**
 * Batch fetch user context (profile + subscription + usage)
 * Replaces N separate queries with 3 parallel queries
 */
export async function getUserContext(userId: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0]

  return Promise.all([
    getUserProfile(userId),
    getUserSubscription(userId),
    getDailyUsage(userId, targetDate),
  ]).then(([profile, subscription, usage]) => ({
    profile,
    subscription,
    usage,
  }))
}

/**
 * Health check: verify all critical tables exist and are accessible
 */
export async function healthCheckTables(): Promise<{
  healthy: boolean
  tables: Record<string, boolean>
}> {
  const criticalTables = [
    'user_profiles',
    'subscriptions',
    'daily_usage',
    'question_explanations',
    'usuario_respostas',
    'checkout_logs',
    'audit_logs',
    'newsletter_subscribers',
  ]

  const tables: Record<string, boolean> = {}

  for (const table of criticalTables) {
    try {
      await dbPool.queryOne(`SELECT 1 FROM ${table} LIMIT 1`)
      tables[table] = true
    } catch (error) {
      tables[table] = false
      console.error(`[db-helpers] Table ${table} not accessible:`, (error as Error).message)
    }
  }

  const healthy = Object.values(tables).every((v) => v)
  return { healthy, tables }
}
