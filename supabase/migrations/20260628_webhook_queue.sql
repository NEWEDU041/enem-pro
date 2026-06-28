-- Webhook queue table for async processing
-- Allows webhooks to return 202 immediately and process in background

CREATE TABLE IF NOT EXISTS webhook_queue (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,

  CONSTRAINT status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes for efficient querying
CREATE INDEX idx_webhook_queue_status ON webhook_queue(status);
CREATE INDEX idx_webhook_queue_type ON webhook_queue(type);
CREATE INDEX idx_webhook_queue_created ON webhook_queue(created_at DESC);

-- Auto-cleanup old completed events (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_webhook_queue()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_queue
  WHERE status IN ('completed', 'failed')
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT pg_cron.schedule('cleanup_webhook_queue', '0 0 * * *', 'SELECT cleanup_webhook_queue()');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON webhook_queue TO authenticated;
