-- Migration: Phase 3 Database Optimization - Advanced Indexing
-- Date: 2026-11-03
-- Purpose: Reduce query times for enem-pro (412 posts, high traffic)
-- 
-- This migration adds composite and partial indexes on hot query patterns
-- Used by: /posts, /questions, user dashboards, filtering

-- 1. Composite index on posts table: (category, published, created_at DESC)
-- Used by: GET /posts (listing by category with pagination)
-- Expected: -40-60% query time for category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_category_published_created
ON posts(category, published DESC NULLS LAST, created_at DESC NULLS LAST)
WHERE published = true;

-- 2. Index on question_explanations(post_id, rank)
-- Used by: /api/questoes/[id] (fetch explanations for a post)
-- Expected: -50% query time for explanation lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_explanations_post_rank
ON question_explanations(post_id, rank);

-- 3. Composite index on usuario_respostas(user_id, post_id, created_at DESC)
-- Used by: User dashboard, progress tracking
-- Expected: -45% query time for user response history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuario_respostas_user_post_created
ON usuario_respostas(user_id, post_id, created_at DESC NULLS LAST);

-- 4. Partial index on usuario_respostas for recent responses (last 30 days)
-- Used by: Active user metrics, real-time dashboards
-- Expected: Index only scans for recent data (faster filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuario_respostas_recent
ON usuario_respostas(user_id, created_at DESC)
WHERE created_at > NOW() - INTERVAL '30 days';

-- 5. Index on subscriptions(email) for fast user lookups
-- Used by: Newsletter verification, user profile lookup
-- Expected: -30% query time for subscription checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_email
ON subscriptions(email);

-- 6. Composite index on newsletter_subscribers(status, created_at DESC)
-- Used by: Newsletter campaign filtering, segmentation
-- Expected: -50% query time for bulk email operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_subscribers_status_created
ON newsletter_subscribers(status, created_at DESC NULLS LAST)
WHERE status = 'active';

-- 7. Index on daily_usage for rate limit queries
-- Used by: /api/user-rate-limit (frequent calls during requests)
-- Expected: <10ms query time (critical for latency)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_usage_user_date_usage
ON daily_usage(user_id, date DESC NULLS LAST, usage_count);

-- 8. Index on audit_logs for security audit trails
-- Used by: /api/admin/audit-logs, security monitoring
-- Expected: -60% query time for audit filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_action_created
ON audit_logs(user_id, action, created_at DESC NULLS LAST);

-- 9. Partial index on checkout_logs for failed payments
-- Used by: Payment retry logic, failed transaction investigation
-- Expected: Fast isolation of problematic payments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkout_logs_failed
ON checkout_logs(user_id, created_at DESC)
WHERE status != 'completed';

-- Refresh table statistics to ensure optimal query plans
-- Run ANALYZE after index creation to update planner metadata
ANALYZE posts;
ANALYZE question_explanations;
ANALYZE usuario_respostas;
ANALYZE subscriptions;
ANALYZE newsletter_subscribers;
ANALYZE daily_usage;
ANALYZE audit_logs;
ANALYZE checkout_logs;

-- Optional: Set maintenance_work_mem for faster index creation (future runs)
-- SET maintenance_work_mem = '1GB';
