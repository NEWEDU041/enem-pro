-- Function to refresh stats_snapshot materialized view
-- Called by Vercel cron via /api/cron/refresh-stats

CREATE OR REPLACE FUNCTION refresh_stats_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW stats_snapshot;
END;
$$;

-- Only service_role can call this
REVOKE EXECUTE ON FUNCTION refresh_stats_snapshot() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION refresh_stats_snapshot() FROM authenticated;
GRANT EXECUTE ON FUNCTION refresh_stats_snapshot() TO service_role;
