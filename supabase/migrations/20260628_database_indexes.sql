-- Performance indexes for frequently queried tables
-- These should significantly improve query performance

-- user_answers indexes
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id_date
ON user_answers(user_id, answered_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_answers_question_id
ON user_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_user_answers_is_correct
ON user_answers(is_correct);

CREATE INDEX IF NOT EXISTS idx_user_answers_date
ON user_answers(DATE(answered_at));

-- daily_usage indexes
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date
ON daily_usage(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_usage_date
ON daily_usage(date);

-- subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at
ON subscriptions(expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan
ON subscriptions(plan);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
ON subscriptions(stripe_subscription_id);

-- user_profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_registered_at
ON user_profiles(registered_at DESC);

-- question_explanations indexes
CREATE INDEX IF NOT EXISTS idx_question_explanations_model
ON question_explanations(model);

CREATE INDEX IF NOT EXISTS idx_question_explanations_year
ON question_explanations(year);

-- email_drip_log indexes
CREATE INDEX IF NOT EXISTS idx_email_drip_log_user_date
ON email_drip_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_drip_log_status
ON email_drip_log(status);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_answers_performance
ON user_answers(user_id, DATE(answered_at), is_correct);

CREATE INDEX IF NOT EXISTS idx_daily_usage_performance
ON daily_usage(user_id, date, count);

-- Analyze query performance (updates statistics)
ANALYZE user_answers;
ANALYZE daily_usage;
ANALYZE subscriptions;
ANALYZE user_profiles;
ANALYZE question_explanations;
ANALYZE email_drip_log;
