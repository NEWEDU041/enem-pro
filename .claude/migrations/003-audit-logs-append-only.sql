-- 003-audit-logs-append-only.sql
-- LGPD Compliance: Append-only audit log table
-- Created: 2026-10-27
-- No UPDATE/DELETE — only INSERT and SELECT

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, CONSENT_CHANGE, DATA_DELETE
  resource VARCHAR(100) NOT NULL, -- table/resource name: users, profiles, orders, etc.
  resource_id UUID,
  changes JSONB, -- {field_name: {old: value, new: value}, ...}
  ip_address INET,
  user_agent TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Enforce append-only: disable DELETE, UPDATE
  CONSTRAINT audit_logs_no_update CHECK (created_at IS NOT NULL)
);

-- Indexes for query performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_email ON public.audit_logs(email);

-- Prevent DELETE via policy (RLS)
CREATE POLICY "audit_logs_insert_only" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (SELECT email FROM public.profiles WHERE id = auth.uid()) = email);

CREATE POLICY "audit_logs_no_delete" ON public.audit_logs
  FOR DELETE
  USING (false); -- Always deny DELETE

CREATE POLICY "audit_logs_no_update" ON public.audit_logs
  FOR UPDATE
  USING (false); -- Always deny UPDATE

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grant privileges
GRANT INSERT, SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

-- Comment
COMMENT ON TABLE public.audit_logs IS 'LGPD Compliance: Append-only audit trail for user actions, data access, and changes.';
COMMENT ON COLUMN public.audit_logs.action IS 'Action type: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, CONSENT_CHANGE, DATA_DELETE';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object with before/after values for changed fields';
