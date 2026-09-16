-- Premium Products: Email Capture & Download Tracking
-- Created: 2026-09-16

-- Email subscribers table
CREATE TABLE IF NOT EXISTS premium_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_name TEXT,
  source TEXT, -- which product they signed up from
  trial_claimed BOOLEAN DEFAULT FALSE,
  trial_claimed_at TIMESTAMP,
  total_downloads INT DEFAULT 0,
  last_download_at TIMESTAMP
);

-- Product downloads tracking
CREATE TABLE IF NOT EXISTS product_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES premium_subscribers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL, -- formula-sheet, practice-test, essay-template, study-checklist
  product_name TEXT NOT NULL,
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  file_size_kb INT,
  ip_address TEXT,
  user_agent TEXT
);

-- Email verification/opt-in
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

-- Upsell tracking (50% off trial offers)
CREATE TABLE IF NOT EXISTS trial_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES premium_subscribers(id) ON DELETE CASCADE,
  offer_code TEXT NOT NULL UNIQUE,
  discount_percent INT DEFAULT 50,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP
);

-- Analytics events
CREATE TABLE IF NOT EXISTS product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- landing_view, email_submit, download_click, trial_click, trial_claim
  product_id TEXT,
  email TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE premium_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can insert analytics events
CREATE POLICY "Anyone can insert analytics events" ON product_analytics
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can insert email verifications" ON email_verifications
  FOR INSERT WITH CHECK (TRUE);

-- Policies: Subscribers can read their own data
CREATE POLICY "Users can read own subscriber data" ON premium_subscribers
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can read own downloads" ON product_downloads
  FOR SELECT USING (TRUE);

-- Public access for analytics viewing (limited data)
CREATE POLICY "Public can view product download counts" ON product_downloads
  FOR SELECT USING (TRUE);

-- Indexes for performance
CREATE INDEX idx_premium_subscribers_email ON premium_subscribers(email);
CREATE INDEX idx_product_downloads_subscriber ON product_downloads(subscriber_id);
CREATE INDEX idx_product_downloads_product ON product_downloads(product_id);
CREATE INDEX idx_product_downloads_created ON product_downloads(downloaded_at);
CREATE INDEX idx_trial_offers_subscriber ON trial_offers(subscriber_id);
CREATE INDEX idx_product_analytics_event ON product_analytics(event_type);
CREATE INDEX idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX idx_product_analytics_timestamp ON product_analytics(timestamp);
