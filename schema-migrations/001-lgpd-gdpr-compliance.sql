-- LGPD/GDPR Compliance Schema Migration
-- 
-- Tables:
-- 1. audit_logs - Complete audit trail
-- 2. user_consents - Consent management
-- 3. encrypted_pii - Encrypted personal data
-- 4. gdpr_requests - GDPR data requests
--
-- Run this on Supabase: Extensions > SQL Editor > Paste & Execute

-- ============================================================================
-- 1. Audit Logs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  action TEXT NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT, CONSENT_CHANGE
  resource TEXT NOT NULL, -- Table/resource name
  resource_id UUID,
  changes JSONB, -- { field: { old: value, new: value } }
  ip TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(email);

-- ============================================================================
-- 2. User Consents Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('essential', 'analytics', 'marketing', 'preferences', 'third_party')),
  granted BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source TEXT, -- 'form', 'api', 'auto', 'revoke'
  ip TEXT,
  user_agent TEXT,
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_timestamp ON user_consents(timestamp DESC);

-- Unique constraint: latest consent per user/type combination handled by app layer
CREATE INDEX IF NOT EXISTS idx_user_consents_latest ON user_consents(user_id, consent_type, timestamp DESC);

-- ============================================================================
-- 3. Encrypted PII Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS encrypted_pii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  field TEXT NOT NULL CHECK (field IN ('email', 'phone', 'cpf', 'ssn')),
  value BYTEA NOT NULL, -- Encrypted value via pgp_sym_encrypt
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, field)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_user_id ON encrypted_pii(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_pii_field ON encrypted_pii(field);

-- ============================================================================
-- 4. GDPR Requests Table (track all data requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'delete', 'rectify', 'restrict')), -- GDPR rights
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_url TEXT, -- Signed URL to exported data (for export requests)
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- When export link expires
  metadata JSONB,
  ip TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_requested_at ON gdpr_requests(requested_at DESC);

-- ============================================================================
-- 5. RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE encrypted_pii ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

-- Audit Logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'service_role');

-- User Consents: Users can view their own, admins can view all
CREATE POLICY "Users view own consents" ON user_consents
  FOR SELECT USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Service role can insert consents" ON user_consents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_user = 'service_role');

-- Encrypted PII: Users view own, service role manages
CREATE POLICY "Users view own encrypted PII" ON encrypted_pii
  FOR SELECT USING (user_id = auth.uid());

-- GDPR Requests: Users view own, admins view all
CREATE POLICY "Users view own GDPR requests" ON gdpr_requests
  FOR SELECT USING (user_id = auth.uid() OR EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to encrypt PII using pgp_sym_encrypt
CREATE OR REPLACE FUNCTION encrypt_pii(plaintext TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(plaintext, encryption_key)::bytea,
    'base64'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to decrypt PII using pgp_sym_decrypt
CREATE OR REPLACE FUNCTION decrypt_pii(ciphertext TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(ciphertext, 'base64'),
    encryption_key
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to log audit events (called from application)
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_email TEXT,
  p_action TEXT,
  p_resource TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, email, action, resource, resource_id,
    changes, ip, user_agent, metadata
  ) VALUES (
    p_user_id, p_email, p_action, p_resource, p_resource_id,
    p_changes, p_ip, p_user_agent, p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's audit trail
CREATE OR REPLACE FUNCTION get_user_audit_trail(p_user_id UUID, p_limit INT DEFAULT 100)
RETURNS TABLE (
  id UUID,
  action TEXT,
  resource TEXT,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    audit_logs.id,
    audit_logs.action,
    audit_logs.resource,
    audit_logs.changes,
    audit_logs.created_at
  FROM audit_logs
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Storage Buckets
-- ============================================================================

-- Create storage bucket for GDPR exports (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('gdpr-exports', 'gdpr-exports', false)
ON CONFLICT DO NOTHING;

-- Set CORS policy for downloads
-- (Can be managed via Supabase UI: Storage > Settings > CORS)

-- ============================================================================
-- Notes:
-- 
-- 1. PII_ENCRYPTION_KEY env var must be set (32+ chars)
-- 2. Run: CREATE EXTENSION pgcrypto; if not already enabled
-- 3. Indexes are created for optimal query performance
-- 4. RLS policies protect data - users only see their own data
-- 5. Audit logs are immutable (no UPDATE/DELETE policies)
-- 6. GDPR export links expire after 7 days (enforce in app)
-- 7. Consents track timestamp + source for audit trail
--
-- ============================================================================
