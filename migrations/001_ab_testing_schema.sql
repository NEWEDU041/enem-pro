-- A/B Testing Infrastructure Tables
-- Run these migrations on Supabase

-- Table: ab_tests
-- Stores A/B test metadata and configuration
CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  variants TEXT[] NOT NULL DEFAULT ARRAY['baseline', 'professional', 'casual'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- Table: ab_test_events
-- Stores individual GTM events for metrics aggregation
CREATE TABLE IF NOT EXISTS ab_test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion', 'custom')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_ab_test_events_test_id ON ab_test_events(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_variant ON ab_test_events(variant);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_timestamp ON ab_test_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_event_type ON ab_test_events(event_type);

-- Table: ab_test_assignments
-- Tracks user variant assignments for consistency
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_id ON ab_test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);

-- Table: ab_test_posts
-- Associates posts with A/B tests
CREATE TABLE IF NOT EXISTS ab_test_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  project_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_id, post_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_ab_test_posts_test_id ON ab_test_posts(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_posts_post_id ON ab_test_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_posts_project_id ON ab_test_posts(project_id);

-- Aggregation View for real-time metrics
CREATE OR REPLACE VIEW ab_test_metrics AS
SELECT
  test_id,
  variant,
  event_type,
  COUNT(*) as event_count,
  DATE_TRUNC('hour', timestamp) as hour
FROM ab_test_events
GROUP BY test_id, variant, event_type, DATE_TRUNC('hour', timestamp);

-- Row-level security
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow service role to read/write)
CREATE POLICY "service_role_read_events" ON ab_test_events
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "service_role_insert_events" ON ab_test_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);
