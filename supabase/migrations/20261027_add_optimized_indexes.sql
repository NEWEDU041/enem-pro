-- Migration: Add optimized indexes for query performance
-- Date: 2026-10-27
-- Purpose: Reduce query times by indexing critical columns for filtering and sorting

-- Index on question_explanations(question_id) for faster lookups
-- Used by: /api/questoes/[id], batch explanation fetches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_explanations_question_id 
ON question_explanations(question_id);

-- Index on usuario_respostas(user_id, created_at) for user response history
-- Used by: /api/portal (user activity), user dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usuario_respostas_user_created 
ON usuario_respostas(user_id, created_at DESC NULLS LAST);

-- Index on checkout_logs(user_id, status) for payment processing
-- Used by: /api/checkout, subscription verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_checkout_logs_user_status 
ON checkout_logs(user_id, status);

-- Index on subscriptions(user_id) for quick subscription lookups
-- Used by: /api/portal, /api/explicar (rate limiting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_id 
ON subscriptions(user_id);

-- Index on daily_usage(user_id, date) for rate limit tracking
-- Used by: /api/user-rate-limit, usage aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_usage_user_date 
ON daily_usage(user_id, date DESC NULLS LAST);

-- Index on audit_logs(user_id, created_at) for audit trails
-- Used by: /api/admin/audit-logs, security monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created 
ON audit_logs(user_id, created_at DESC NULLS LAST);

-- Composite index on newsletter_subscribers(email, status) for bulk operations
-- Used by: /api/newsletter, email campaign filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_newsletter_subscribers_email_status 
ON newsletter_subscribers(email, status);

-- ANALYZE tables to update query planner statistics
-- This should be run after index creation to ensure optimal query plans
ANALYZE question_explanations;
ANALYZE usuario_respostas;
ANALYZE checkout_logs;
ANALYZE subscriptions;
ANALYZE daily_usage;
ANALYZE audit_logs;
ANALYZE newsletter_subscribers;
