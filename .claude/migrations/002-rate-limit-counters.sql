/**
 * Supabase Migration: Create user_rate_limit_counters table
 * 
 * Creates table to track daily/hourly/burst request counts per user
 * Includes indexes for fast queries and cleanup
 */

-- Create user_rate_limit_counters table
CREATE TABLE IF NOT EXISTS user_rate_limit_counters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  daily_count INTEGER DEFAULT 0,
  hourly_count INTEGER DEFAULT 0,
  burst_count INTEGER DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_date ON user_rate_limit_counters(user_id, date);
CREATE INDEX IF NOT EXISTS idx_rate_limit_date ON user_rate_limit_counters(date);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON user_rate_limit_counters(created_at);

-- Enable RLS for security
ALTER TABLE user_rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own rate limit data
CREATE POLICY "Users can view own rate limits" 
  ON user_rate_limit_counters 
  FOR SELECT 
  USING (auth.uid()::text = user_id);

-- RLS Policy: System can write (auth.jwt() -> 'role' = 'service_role' or user matches)
CREATE POLICY "System can update rate limits"
  ON user_rate_limit_counters
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Create RPC function to atomically increment counters (prevents race conditions)
CREATE OR REPLACE FUNCTION increment_rate_limit_counters(
  p_user_id TEXT,
  p_date DATE,
  p_hour TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO user_rate_limit_counters (user_id, date, daily_count, hourly_count, burst_count, last_request_at)
  VALUES (p_user_id, p_date, 1, 1, 1, NOW())
  ON CONFLICT (user_id, date) DO UPDATE SET
    daily_count = daily_count + 1,
    hourly_count = hourly_count + 1,
    burst_count = burst_count + 1,
    last_request_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create maintenance function to clean up old records (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_records()
RETURNS void AS $$
BEGIN
  DELETE FROM user_rate_limit_counters 
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE user_rate_limit_counters IS 'Tracks daily/hourly/burst request counts per user per day. Expires after 90 days.';
COMMENT ON COLUMN user_rate_limit_counters.daily_count IS 'Total requests made today (resets at midnight UTC)';
COMMENT ON COLUMN user_rate_limit_counters.hourly_count IS 'Requests made in the current hour (resets every hour)';
COMMENT ON COLUMN user_rate_limit_counters.burst_count IS 'Requests made in the last 1 minute (for burst protection)';
