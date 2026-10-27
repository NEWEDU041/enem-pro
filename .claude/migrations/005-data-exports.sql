-- 005-data-exports.sql
-- LGPD Compliance: User data export requests and history
-- Created: 2026-10-27

CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  export_format VARCHAR(20) NOT NULL DEFAULT 'json', -- 'json', 'csv', 'pdf'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, expired
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Data package info
  file_url TEXT, -- S3/signed URL to download
  file_size_bytes INTEGER,
  checksum_sha256 TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  reason VARCHAR(255), -- 'user_request', 'gdpr_right', 'deletion_preparation'
  metadata JSONB, -- included_tables, filters, etc.
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  CONSTRAINT export_status_valid CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')
  ),
  CONSTRAINT export_format_valid CHECK (
    export_format IN ('json', 'csv', 'pdf')
  )
);

-- Data deletion requests (LGPD right to be forgotten)
CREATE TABLE IF NOT EXISTS public.data_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  grace_period_until TIMESTAMP WITH TIME ZONE NOT NULL, -- Usually 30 days after request
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, scheduled, in_progress, completed, cancelled
  
  -- Deletion scope
  scope VARCHAR(255) NOT NULL DEFAULT 'all', -- 'all', 'account', 'data', 'specific'
  scope_details JSONB, -- Which tables/fields to delete if specific
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  reason VARCHAR(255),
  
  -- Execution info
  deleted_at TIMESTAMP WITH TIME ZONE,
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Admin who executed
  execution_summary JSONB, -- {tables_cleared: [...], records_deleted: N}
  
  CONSTRAINT deletion_status_valid CHECK (
    status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'failed')
  )
);

-- Indexes for queries
CREATE INDEX idx_data_exports_user_id ON public.data_exports(user_id);
CREATE INDEX idx_data_exports_status ON public.data_exports(status);
CREATE INDEX idx_data_exports_created_at ON public.data_exports(requested_at DESC);
CREATE INDEX idx_data_deletions_user_id ON public.data_deletions(user_id);
CREATE INDEX idx_data_deletions_status ON public.data_deletions(status);
CREATE INDEX idx_data_deletions_grace_period ON public.data_deletions(grace_period_until);

-- Enable RLS
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletions ENABLE ROW LEVEL SECURITY;

-- Policies: users can view their own exports/deletions
CREATE POLICY "data_exports_select_own" ON public.data_exports
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "data_exports_insert_own" ON public.data_exports
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "data_deletions_select_own" ON public.data_deletions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "data_deletions_insert_own" ON public.data_deletions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Grant privileges
GRANT SELECT, INSERT ON public.data_exports TO authenticated;
GRANT SELECT, INSERT ON public.data_deletions TO authenticated;
GRANT ALL ON public.data_exports, public.data_deletions TO service_role;

-- Comments
COMMENT ON TABLE public.data_exports IS 'LGPD Compliance: User data export requests (portability right)';
COMMENT ON TABLE public.data_deletions IS 'LGPD Compliance: User data deletion requests (right to be forgotten)';
COMMENT ON COLUMN public.data_deletions.grace_period_until IS 'Deletion is not final until this date passes (compliance window)';
