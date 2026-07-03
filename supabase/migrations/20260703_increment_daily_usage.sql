-- Atomic increment for daily_usage to close a race condition:
-- previous code did read-then-upsert (SELECT count, then UPSERT count+n) from
-- TypeScript, so parallel requests could both read the same stale count and
-- clobber each other's increment, letting free users exceed the daily limit.

CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_date DATE,
  p_n INT
)
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO daily_usage (user_id, date, count)
  VALUES (p_user_id, p_date, p_n)
  ON CONFLICT (user_id, date) DO UPDATE
  SET count = daily_usage.count + p_n
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION increment_daily_usage TO authenticated;
