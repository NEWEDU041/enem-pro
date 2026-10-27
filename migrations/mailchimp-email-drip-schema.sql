-- Mailchimp Integration & Email Drip Campaign Schema
-- Migration: Add tables for email drip campaigns, segmentation, A/B testing, and metrics

-- 1. MAILCHIMP CONFIGURATION
CREATE TABLE IF NOT EXISTS mailchimp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT UNIQUE NOT NULL,
  api_key TEXT ENCRYPTED NOT NULL,
  api_server TEXT NOT NULL,
  audience_id TEXT NOT NULL,
  account_name TEXT,
  oauth_access_token TEXT ENCRYPTED,
  oauth_refresh_token TEXT ENCRYPTED,
  oauth_expires_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. DRIP CAMPAIGNS
CREATE TABLE IF NOT EXISTS drip_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('onboarding', 'nurture', 'reengagement', 'churnrisk', 'upgrade')),
  description TEXT,
  day_offsets INTEGER[] NOT NULL DEFAULT ARRAY[0],
  email_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  segment_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. DRIP EMAIL LOGS (track each sent email)
CREATE TABLE IF NOT EXISTS drip_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('onboarding', 'nurture', 'reengagement', 'churnrisk', 'upgrade')),
  campaign_id TEXT REFERENCES drip_campaigns(id),
  day_offset INTEGER DEFAULT 0,
  email_content JSONB,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  mailchimp_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_campaign (user_id, campaign_type),
  INDEX idx_sent_at (sent_at DESC)
);

-- 4. EMAIL ENGAGEMENT TRACKING
CREATE TABLE IF NOT EXISTS email_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  drip_log_id UUID REFERENCES drip_email_logs(id) ON DELETE CASCADE,
  campaign_id TEXT REFERENCES drip_campaigns(id),
  campaign_type TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click', 'conversion', 'unsubscribe', 'bounce')),
  link_url TEXT,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_event (user_id, event_type),
  INDEX idx_campaign_type (campaign_type),
  INDEX idx_created_at (created_at DESC)
);

-- 5. EMAIL SEGMENTS
CREATE TABLE IF NOT EXISTS email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cohort', 'behavior', 'churnrisk')),
  user_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  segment_size INTEGER DEFAULT 0,
  criteria JSONB DEFAULT '{}'::JSONB,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at DESC)
);

-- 6. CHURN RISK SCORES (ML-based)
CREATE TABLE IF NOT EXISTS churn_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE UNIQUE,
  risk_score DECIMAL(3, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  factors JSONB NOT NULL DEFAULT '{}'::JSONB,
  calculated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_risk_level (risk_level),
  INDEX idx_calculated_at (calculated_at DESC)
);

-- 7. A/B TESTS
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT,
  campaign_type TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('subject', 'sendtime', 'content', 'multivariate')),
  winning_metric TEXT NOT NULL CHECK (winning_metric IN ('open_rate', 'click_rate', 'conversion_rate')),
  test_duration_hours INTEGER DEFAULT 24,
  variants JSONB NOT NULL DEFAULT '[]'::JSONB,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'running', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_campaign_id (campaign_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
);

-- 8. A/B TEST EVENTS
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'open', 'click', 'conversion', 'unsubscribe', 'bounce')),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_test_variant (test_id, variant_id),
  INDEX idx_user_id (user_id)
);

-- 9. A/B TEST RESULTS
CREATE TABLE IF NOT EXISTS ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE UNIQUE,
  winner_variant_id TEXT NOT NULL,
  winner_metric_value DECIMAL(5, 4),
  all_results JSONB NOT NULL DEFAULT '{}'::JSONB,
  calculated_at TIMESTAMP DEFAULT NOW(),
  applied_at TIMESTAMP
);

-- 10. CAMPAIGN METRICS
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailchimp_campaign_id TEXT UNIQUE,
  campaign_type TEXT,
  campaign_name TEXT NOT NULL,
  campaign_status TEXT,
  emails_sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  unsubscribes INTEGER DEFAULT 0,
  bounces INTEGER DEFAULT 0,
  complaints INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_campaign_id (mailchimp_campaign_id),
  INDEX idx_type (campaign_type),
  INDEX idx_sent_at (sent_at DESC)
);

-- 11. WEBHOOKS AUDIT LOG
CREATE TABLE IF NOT EXISTS mailchimp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_event_type (event_type),
  INDEX idx_processed_at (processed_at DESC)
);

-- 12. SUBSCRIBER DATA
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscribed_at TIMESTAMP,
  unsubscribed_at TIMESTAMP,
  unsubscribe_reason TEXT,
  subscription_status TEXT DEFAULT 'subscribed' CHECK (subscription_status IN ('subscribed', 'unsubscribed', 'cleaned', 'pending')),
  lead_magnet TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  mailchimp_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_email (email),
  INDEX idx_status (subscription_status),
  INDEX idx_created_at (created_at DESC)
);

-- GRANTS & PERMISSIONS
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
-- Allow admins to view all
CREATE POLICY admin_all ON drip_email_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY admin_all ON email_engagement
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Allow users to view their own engagement
CREATE POLICY user_own_engagement ON email_engagement
  FOR SELECT USING (user_id = auth.uid());

-- Allow users to view their own drip logs
CREATE POLICY user_own_drip ON drip_email_logs
  FOR SELECT USING (user_id = auth.uid());
