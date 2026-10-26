-- Advanced Analytics: Cohort, Retention, Churn Prediction
-- Created: 2026-10-26

-- Cohort tracking table: signup date grouped by week/month
CREATE TABLE IF NOT EXISTS cohort_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES premium_subscribers(id) ON DELETE CASCADE,
  cohort_year_week TEXT NOT NULL, -- e.g., "2026-W42"
  cohort_date DATE NOT NULL, -- signup date
  signup_source TEXT, -- landing_page, email_campaign, social, etc
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(subscriber_id, cohort_year_week)
);

-- Retention events: track login/activity per user per week
CREATE TABLE IF NOT EXISTS retention_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES premium_subscribers(id) ON DELETE CASCADE,
  event_year_week TEXT NOT NULL, -- e.g., "2026-W42"
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'login', 'download', 'email_open', 'trial_claim'
  session_duration_seconds INT DEFAULT 0,
  last_active_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Churn score: calculated weekly per user
CREATE TABLE IF NOT EXISTS churn_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES premium_subscribers(id) ON DELETE CASCADE,
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  churn_score FLOAT NOT NULL, -- 0.0 to 1.0, higher = more likely to churn
  inactivity_days INT,
  days_since_last_login INT,
  average_session_duration INT,
  lifetime_engagement_score FLOAT,
  predicted_churn BOOLEAN DEFAULT FALSE, -- true if churn_score > 0.7
  churn_risk_level TEXT, -- 'low', 'medium', 'high', 'critical'
  reason_codes TEXT[] DEFAULT '{}', -- array of reasons for churn risk
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Revenue forecast: daily revenue forecast with Prophet
CREATE TABLE IF NOT EXISTS revenue_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_date DATE NOT NULL,
  forecast_week TEXT NOT NULL, -- "2026-W42"
  predicted_revenue FLOAT NOT NULL,
  confidence_interval_lower FLOAT,
  confidence_interval_upper FLOAT,
  actual_revenue FLOAT,
  forecast_accuracy FLOAT, -- once actual_revenue is available
  seasonality_factor FLOAT,
  trend_component FLOAT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(forecast_date)
);

-- Enable RLS
ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecast ENABLE ROW LEVEL SECURITY;

-- Policies: Public read for analytics dashboards
CREATE POLICY "Public can read cohort analysis" ON cohort_analysis
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read retention events" ON retention_events
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read churn scores" ON churn_scores
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can read revenue forecast" ON revenue_forecast
  FOR SELECT USING (TRUE);

-- Indexes for performance
CREATE INDEX idx_cohort_subscriber ON cohort_analysis(subscriber_id);
CREATE INDEX idx_cohort_week ON cohort_analysis(cohort_year_week);
CREATE INDEX idx_cohort_date ON cohort_analysis(cohort_date);

CREATE INDEX idx_retention_subscriber ON retention_events(subscriber_id);
CREATE INDEX idx_retention_week ON retention_events(event_year_week);
CREATE INDEX idx_retention_event_type ON retention_events(event_type);
CREATE INDEX idx_retention_last_active ON retention_events(last_active_at);

CREATE INDEX idx_churn_subscriber ON churn_scores(subscriber_id);
CREATE INDEX idx_churn_score ON churn_scores(churn_score);
CREATE INDEX idx_churn_predicted ON churn_scores(predicted_churn);
CREATE INDEX idx_churn_updated ON churn_scores(updated_at);

CREATE INDEX idx_revenue_forecast_date ON revenue_forecast(forecast_date);
CREATE INDEX idx_revenue_forecast_week ON revenue_forecast(forecast_week);

-- Materialized views for performance

-- Cohort retention matrix view
CREATE MATERIALIZED VIEW IF NOT EXISTS v_cohort_retention_matrix AS
SELECT 
  c.cohort_year_week,
  COUNT(DISTINCT c.subscriber_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) THEN r.subscriber_id END) as week_0_active,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '7 days' THEN r.subscriber_id END) as week_1_active,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '28 days' THEN r.subscriber_id END) as week_4_active,
  COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '91 days' THEN r.subscriber_id END) as week_13_active,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '7 days' THEN r.subscriber_id END) / NULLIF(COUNT(DISTINCT c.subscriber_id), 0), 2) as retention_1w_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '28 days' THEN r.subscriber_id END) / NULLIF(COUNT(DISTINCT c.subscriber_id), 0), 2) as retention_4w_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', r.event_date) >= DATE_TRUNC('week', c.cohort_date) + INTERVAL '91 days' THEN r.subscriber_id END) / NULLIF(COUNT(DISTINCT c.subscriber_id), 0), 2) as retention_13w_pct
FROM cohort_analysis c
LEFT JOIN retention_events r ON c.subscriber_id = r.subscriber_id
GROUP BY c.cohort_year_week
ORDER BY c.cohort_year_week DESC;

-- Churn risk summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS v_churn_risk_summary AS
SELECT 
  churn_risk_level,
  COUNT(*) as user_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct_of_total,
  ROUND(AVG(churn_score), 3) as avg_churn_score,
  ROUND(AVG(inactivity_days), 1) as avg_inactivity_days,
  MAX(updated_at) as last_calculated
FROM churn_scores
GROUP BY churn_risk_level
ORDER BY 
  CASE WHEN churn_risk_level = 'critical' THEN 1
       WHEN churn_risk_level = 'high' THEN 2
       WHEN churn_risk_level = 'medium' THEN 3
       ELSE 4
  END;

-- Weekly cohort growth view
CREATE MATERIALIZED VIEW IF NOT EXISTS v_weekly_cohort_growth AS
SELECT 
  cohort_year_week,
  DATE_TRUNC('week', cohort_date)::DATE as week_start,
  COUNT(*) as new_subscribers,
  COUNT(DISTINCT signup_source) as unique_sources,
  MAX(cohort_date) as latest_signup_date
FROM cohort_analysis
GROUP BY cohort_year_week, DATE_TRUNC('week', cohort_date)::DATE
ORDER BY cohort_year_week DESC;

-- Functions for populating analytics tables

CREATE OR REPLACE FUNCTION populate_cohort_analysis()
RETURNS void AS $$
BEGIN
  INSERT INTO cohort_analysis (subscriber_id, cohort_year_week, cohort_date, signup_source)
  SELECT 
    id,
    TO_CHAR(created_at, 'IYYY-"W"IW') as cohort_year_week,
    created_at::DATE as cohort_date,
    source as signup_source
  FROM premium_subscribers ps
  WHERE id NOT IN (SELECT subscriber_id FROM cohort_analysis)
  ON CONFLICT (subscriber_id, cohort_year_week) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION populate_retention_events()
RETURNS void AS $$
BEGIN
  INSERT INTO retention_events (subscriber_id, event_year_week, event_date, event_type, last_active_at)
  SELECT 
    subscriber_id,
    TO_CHAR(downloaded_at, 'IYYY-"W"IW') as event_year_week,
    downloaded_at::DATE as event_date,
    'download' as event_type,
    downloaded_at as last_active_at
  FROM product_downloads pd
  WHERE (subscriber_id, downloaded_at::DATE) NOT IN (SELECT subscriber_id, event_date FROM retention_events)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_churn_score(p_subscriber_id UUID)
RETURNS FLOAT AS $$
DECLARE
  v_inactivity_days INT;
  v_days_since_login INT;
  v_avg_session_duration INT;
  v_lifetime_engagement FLOAT;
  v_churn_score FLOAT;
BEGIN
  -- Calculate inactivity days
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(MAX(last_download_at), created_at)))::INT
  INTO v_inactivity_days
  FROM premium_subscribers
  WHERE id = p_subscriber_id;
  
  -- Days since last login (approximated by last download)
  SELECT EXTRACT(DAY FROM (NOW() - COALESCE(MAX(downloaded_at), created_at)))::INT
  INTO v_days_since_login
  FROM product_downloads
  WHERE subscriber_id = p_subscriber_id;
  
  -- Average session duration (approximated as downloads per week)
  SELECT COALESCE(ROUND(COUNT(*)::FLOAT / NULLIF((EXTRACT(DAY FROM (NOW() - created_at)))::FLOAT / 7, 0), 0), 0)::INT
  INTO v_avg_session_duration
  FROM product_downloads
  WHERE subscriber_id = p_subscriber_id;
  
  -- Lifetime engagement score (0-1): downloads / expected downloads
  SELECT COALESCE(LEAST(COUNT(*) / 10.0, 1.0), 0.0)
  INTO v_lifetime_engagement
  FROM product_downloads
  WHERE subscriber_id = p_subscriber_id;
  
  -- Churn score calculation (0-1, higher = more likely to churn)
  v_churn_score := 
    (LEAST(v_inactivity_days::FLOAT / 90, 1.0) * 0.5) +  -- 50% weight: inactivity
    ((1.0 - v_lifetime_engagement) * 0.3) +              -- 30% weight: low engagement
    (CASE WHEN v_days_since_login > 60 THEN 0.2 ELSE 0.0 END);  -- 20% weight: no recent activity
  
  RETURN LEAST(GREATEST(v_churn_score, 0.0), 1.0);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_churn_scores()
RETURNS TABLE (processed_count INT) AS $$
DECLARE
  v_count INT := 0;
BEGIN
  INSERT INTO churn_scores (subscriber_id, churn_score, inactivity_days, days_since_last_login, average_session_duration, lifetime_engagement_score, predicted_churn, churn_risk_level)
  SELECT 
    ps.id,
    calculate_churn_score(ps.id),
    EXTRACT(DAY FROM (NOW() - COALESCE(ps.last_download_at, ps.created_at)))::INT,
    EXTRACT(DAY FROM (NOW() - COALESCE(ps.last_download_at, ps.created_at)))::INT,
    COALESCE(ROUND(COUNT(pd.id)::FLOAT / NULLIF((EXTRACT(DAY FROM (NOW() - ps.created_at)))::FLOAT / 7, 0), 0), 0)::INT,
    COALESCE(LEAST(COUNT(pd.id)::FLOAT / 10.0, 1.0), 0.0),
    (calculate_churn_score(ps.id) > 0.7),
    CASE 
      WHEN calculate_churn_score(ps.id) > 0.8 THEN 'critical'
      WHEN calculate_churn_score(ps.id) > 0.6 THEN 'high'
      WHEN calculate_churn_score(ps.id) > 0.4 THEN 'medium'
      ELSE 'low'
    END
  FROM premium_subscribers ps
  LEFT JOIN product_downloads pd ON ps.id = pd.subscriber_id
  WHERE ps.id NOT IN (SELECT subscriber_id FROM churn_scores WHERE DATE(updated_at) = CURRENT_DATE)
  GROUP BY ps.id, ps.created_at, ps.last_download_at
  ON CONFLICT (subscriber_id) DO UPDATE
  SET updated_at = NOW(),
      churn_score = EXCLUDED.churn_score,
      predicted_churn = EXCLUDED.predicted_churn,
      churn_risk_level = EXCLUDED.churn_risk_level
  RETURNING NULL INTO v_count;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON v_cohort_retention_matrix TO anon, authenticated;
GRANT SELECT ON v_churn_risk_summary TO anon, authenticated;
GRANT SELECT ON v_weekly_cohort_growth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION populate_cohort_analysis() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION populate_retention_events() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_churn_scores() TO anon, authenticated;
