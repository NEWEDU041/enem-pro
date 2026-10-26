/**
 * Database batch helpers for optimized Supabase queries
 * Reduces N+1 queries by parallelizing independent Supabase calls
 */

import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Batch fetch user subscription and daily usage in parallel
 * Used by /api/explicar to avoid sequential queries
 * 
 * @param userId - User ID to fetch context for
 * @param supabase - Supabase client (server-side)
 * @param dateString - Date in YYYY-MM-DD format (default: today)
 * @returns Object with subscription and usage data
 */
export async function batchFetchUserContext(
  userId: string,
  supabase: SupabaseClient,
  dateString?: string
) {
  const date = dateString || new Date().toISOString().split('T')[0]

  // Execute both queries in parallel
  const [subResult, usageResult] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan, expires_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('daily_usage')
      .select('explanation_count')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle(),
  ])

  return {
    subscription: {
      data: subResult.data,
      error: subResult.error,
    },
    usage: {
      data: usageResult.data,
      error: usageResult.error,
    },
  }
}

/**
 * Batch fetch multiple questions with their explanations
 * Used by bulk explanation generation or batch retrieval
 * 
 * @param questionIds - Array of question IDs (e.g., ["2022-5", "2021-10"])
 * @param supabase - Supabase client
 * @returns Object with matches and missing IDs
 */
export async function batchFetchExplanations(
  questionIds: string[],
  supabase: SupabaseClient
) {
  if (questionIds.length === 0) {
    return { explanations: [], missing: [] }
  }

  const { data: explanations, error } = await supabase
    .from('question_explanations')
    .select('question_id, explanation, model, created_at')
    .in('question_id', questionIds)

  if (error) {
    return { explanations: [], missing: questionIds, error }
  }

  const foundIds = new Set(
    explanations?.map((e: any) => e.question_id) || []
  )
  const missingIds = questionIds.filter((id) => !foundIds.has(id))

  return {
    explanations: explanations || [],
    missing: missingIds,
  }
}

/**
 * Upsert multiple explanations in batch
 * Reduces database round-trips for bulk generation scripts
 * 
 * @param explanations - Array of { question_id, explanation, model }
 * @param supabase - Supabase client
 * @returns Result with success count and errors
 */
export async function batchUpsertExplanations(
  explanations: Array<{
    question_id: string
    explanation: string
    model: string
  }>,
  supabase: SupabaseClient
) {
  if (explanations.length === 0) {
    return { success: 0, failed: 0, errors: [] }
  }

  const { error, count } = await supabase
    .from('question_explanations')
    .upsert(explanations, {
      onConflict: 'question_id',
    })

  if (error) {
    return {
      success: 0,
      failed: explanations.length,
      errors: [error.message],
    }
  }

  return {
    success: count || explanations.length,
    failed: 0,
    errors: [],
  }
}

/**
 * Check multiple users' rate limits in parallel
 * Used by admin tools or batch operations
 * 
 * @param userIds - Array of user IDs
 * @param supabase - Supabase client
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Map of userId -> usage count
 */
export async function batchCheckRateLimits(
  userIds: string[],
  supabase: SupabaseClient,
  dateString?: string
) {
  const date = dateString || new Date().toISOString().split('T')[0]

  const { data: usages, error } = await supabase
    .from('daily_usage')
    .select('user_id, explanation_count')
    .in('user_id', userIds)
    .eq('date', date)

  if (error) {
    return new Map<string, number>()
  }

  const usageMap = new Map<string, number>()
  for (const usage of usages || []) {
    usageMap.set(usage.user_id, usage.explanation_count || 0)
  }

  return usageMap
}

/**
 * Increment daily usage for multiple users
 * Useful for batch explanations or bulk updates
 * 
 * @param updates - Array of { user_id, explanation_count }
 * @param supabase - Supabase client
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Result with success/failure counts
 */
export async function batchIncrementUsage(
  updates: Array<{ user_id: string; increment: number }>,
  supabase: SupabaseClient,
  dateString?: string
) {
  if (updates.length === 0) {
    return { success: 0, failed: 0 }
  }

  const date = dateString || new Date().toISOString().split('T')[0]

  // Fetch current state first
  const userIds = updates.map((u) => u.user_id)
  const { data: current } = await supabase
    .from('daily_usage')
    .select('user_id, explanation_count')
    .in('user_id', userIds)
    .eq('date', date)

  const currentMap = new Map<string, number>()
  for (const row of current || []) {
    currentMap.set(row.user_id, row.explanation_count || 0)
  }

  // Prepare upsert payload
  const upsertPayload = updates.map((u) => ({
    user_id: u.user_id,
    date,
    explanation_count: (currentMap.get(u.user_id) || 0) + u.increment,
  }))

  const { error, count } = await supabase
    .from('daily_usage')
    .upsert(upsertPayload, {
      onConflict: 'user_id,date',
    })

  if (error) {
    return { success: 0, failed: updates.length }
  }

  return { success: count || updates.length, failed: 0 }
}

/**
 * Fetch user profile with subscription in one optimized batch
 * Replaces separate calls: user_profiles + subscriptions
 * 
 * @param userId - User ID
 * @param supabase - Supabase client
 * @returns Combined user profile + subscription object or null
 */
export async function batchFetchUserProfile(
  userId: string,
  supabase: SupabaseClient
) {
  const [profileResult, subResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, email, name, registered_at')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, expires_at, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profileResult.error || !profileResult.data) {
    return null
  }

  return {
    profile: profileResult.data,
    subscription: subResult.data,
    subscriptionError: subResult.error,
  }
}

/**
 * Validates that batch operations succeeded
 * Used in error handling to determine rollback strategy
 * 
 * @param results - Array of batch operation results
 * @returns true if all succeeded, false if any failed
 */
export function batchResultsSucceeded(
  results: Array<{ error?: any; count?: number }>
): boolean {
  return results.every((r) => !r.error)
}

/**
 * Log batch operation performance
 * Helpful for monitoring N+1 improvements
 * 
 * @param operation - Operation name (e.g., "batch_fetch_explanations")
 * @param duration - Time in milliseconds
 * @param count - Number of items processed
 * @param errors - Error count
 */
export function logBatchOperation(
  operation: string,
  duration: number,
  count: number,
  errors: number = 0
) {
  const rate = count > 0 ? Math.round((count / duration) * 1000) : 0
  console.log(
    `[${operation}] ${count} items in ${duration}ms (${rate} items/sec, ${errors} errors)`
  )
}
