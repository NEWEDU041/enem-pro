-- 004-consent-tracking.sql
-- LGPD Compliance: User consent preferences and history
-- Created: 2026-10-27

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'marketing', 'analytics', 'third_party', 'data_processing'
  granted BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- Version of consent doc, consent source, etc.
  
  -- Track consent history
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, consent_type),
  CONSTRAINT consent_type_valid CHECK (
    consent_type IN ('marketing', 'analytics', 'third_party', 'data_processing', 'cookie_essential')
  )
);

-- Audit trail for consent changes (immutable history)
CREATE TABLE IF NOT EXISTS public.consent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted_before BOOLEAN,
  granted_after BOOLEAN NOT NULL,
  change_reason VARCHAR(255), -- 'user_request', 'withdrawal', 'expiry', 'admin_action'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  CONSTRAINT consent_audit_no_update CHECK (changed_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);
CREATE INDEX idx_consent_audit_user_id ON public.consent_audit(user_id);
CREATE INDEX idx_consent_audit_changed_at ON public.consent_audit(changed_at DESC);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own consents
CREATE POLICY "user_consents_select_own" ON public.user_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_consents_update_own" ON public.user_consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_consents_insert_own" ON public.user_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "consent_audit_select_own" ON public.consent_audit
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Grant privileges
GRANT SELECT, UPDATE, INSERT ON public.user_consents TO authenticated;
GRANT SELECT ON public.consent_audit TO authenticated;
GRANT ALL ON public.user_consents, public.consent_audit TO service_role;

-- Comments
COMMENT ON TABLE public.user_consents IS 'LGPD Compliance: Current user consent preferences';
COMMENT ON TABLE public.consent_audit IS 'LGPD Compliance: Immutable history of consent changes';
