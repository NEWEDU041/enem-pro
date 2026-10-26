-- Database Performance Optimization: Missing Indexes
-- Created: 2026-10-26
-- Scope: question_explanations, subscriptions, daily_usage critical indexes

-- ============================================================================
-- CRITICAL INDEXES: Must have for /api/explicar performance
-- ============================================================================

-- question_explanations: lookup by question_id (cache hits)
CREATE INDEX IF NOT EXISTS idx_question_explanations_question_id
ON question_explanations(question_id);

-- question_explanations: composite for bulk lookups (year-based filtering)
CREATE INDEX IF NOT EXISTS idx_question_explanations_question_year
ON question_explanations(question_id, year);

-- subscriptions: primary lookup by user_id (every auth request)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id);

-- subscriptions: composite for isPro() checks + expiry
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_plan_expires
ON subscriptions(user_id, plan, expires_at DESC);

-- ============================================================================
-- RECOMMENDED INDEXES: Improve query efficiency
-- ============================================================================

-- daily_usage: single column lookup (complement to composite index)
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id
ON daily_usage(user_id);

-- question_explanations: model-based bulk lookups
CREATE INDEX IF NOT EXISTS idx_question_explanations_model_created
ON question_explanations(model, created_at DESC);

-- ============================================================================
-- COMPOSITE INDEXES: Multi-column optimization
-- ============================================================================

-- For /api/explicar user context lookup: (user_id, plan, expires_at)
-- Covers: subscription status + expiry in single index scan
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_context
ON subscriptions(user_id, plan, expires_at DESC)
WHERE expires_at > NOW();  -- Only index active subscriptions

-- For daily_usage + rate limit checks: (user_id, date, explanation_count)
-- Covers: rate limit + usage tracking in single index scan
CREATE INDEX IF NOT EXISTS idx_daily_usage_rate_limit
ON daily_usage(user_id, date DESC, explanation_count);

-- ============================================================================
-- STATISTICS UPDATE: Helps query planner
-- ============================================================================

ANALYZE question_explanations;
ANALYZE subscriptions;
ANALYZE daily_usage;

-- ============================================================================
-- VERIFICATION QUERY (run after migration):
-- ============================================================================
-- SELECT * FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC
-- LIMIT 10;
-- ============================================================================
