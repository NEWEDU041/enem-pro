-- Optimize admin stats endpoint with materialized view
-- Before: 9 separate queries
-- After: 1 query to view (refreshed daily)

CREATE MATERIALIZED VIEW stats_snapshot AS
SELECT
  CURRENT_DATE as snapshot_date,
  CURRENT_TIMESTAMP as snapshot_time,
  -- Users
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE registered_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
  -- Answers
  (SELECT COUNT(*) FROM user_answers) as total_answers,
  (SELECT COUNT(*) FROM user_answers WHERE DATE(answered_at) = CURRENT_DATE) as answers_today,
  -- Subscriptions
  (SELECT COUNT(*) FROM subscriptions WHERE plan = 'pro' AND expires_at > NOW()) as pro_active,
  -- Emails
  (SELECT COUNT(*) FROM email_drip_log) as emails_sent,
  -- Cache
  (SELECT MAX(cached_at) FROM questions_cache) as cache_last_update,
  -- Paywall
  (SELECT COUNT(DISTINCT user_id) FROM daily_usage WHERE date = CURRENT_DATE AND count >= 10) as paywall_hits_today,
  -- AI Usage (last 30 days)
  (SELECT SUM(COALESCE(count, 0)) FROM daily_usage WHERE date >= CURRENT_DATE - INTERVAL '30 days') as total_answers_30d,
  (SELECT SUM(COALESCE(explanation_count, 0)) FROM daily_usage WHERE date >= CURRENT_DATE - INTERVAL '30 days') as ai_explanations_30d;

-- Create index for faster lookups
CREATE INDEX idx_stats_snapshot_date ON stats_snapshot(snapshot_date DESC);

-- Grant permissions
GRANT SELECT ON stats_snapshot TO authenticated;

-- Refresh view daily at 00:00 UTC
-- Note: Use pg_cron extension or trigger refresh manually
-- For manual: SELECT pg_cron.schedule('refresh_stats', '0 0 * * *', 'REFRESH MATERIALIZED VIEW stats_snapshot');
