-- Create subscribers table for email funnel
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Lead magnet tracking
  lead_magnet VARCHAR(100),
  downloaded_at TIMESTAMP WITH TIME ZONE,

  -- Trial tracking
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  trial_status VARCHAR(50) DEFAULT 'not_started',

  -- Subscription status
  is_paid BOOLEAN DEFAULT FALSE,
  subscription_start_at TIMESTAMP WITH TIME ZONE,
  subscription_plan VARCHAR(50),

  -- UTM tracking
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Email engagement
  last_email_opened TIMESTAMP WITH TIME ZONE,
  email_open_count INTEGER DEFAULT 0,
  email_click_count INTEGER DEFAULT 0,

  -- Unsubscribe
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_reason VARCHAR(255),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Indexes
  UNIQUE(email),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_is_paid (is_paid),
  INDEX idx_trial_status (trial_status),
  INDEX idx_utm_source (utm_source)
);

-- Email log table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  email_type VARCHAR(100), -- welcome, weekly_tip, trial_convert, etc
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,

  subject VARCHAR(255),
  resend_id VARCHAR(255) UNIQUE,

  INDEX idx_subscriber_id (subscriber_id),
  INDEX idx_sent_at (sent_at DESC),
  INDEX idx_email_type (email_type)
);

-- RLS (Row Level Security)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public to insert subscribers"
  ON public.subscribers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to read subscribers"
  ON public.subscribers
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated to update own subscriber"
  ON public.subscribers
  FOR UPDATE
  USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');
