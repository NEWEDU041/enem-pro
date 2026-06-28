-- Optimization: Consolidate responder logic into SQL function
-- Before: 2-3 sequential queries in TypeScript
-- After: 1 atomic SQL call

CREATE OR REPLACE FUNCTION record_answer(
  p_user_id UUID,
  p_question_id TEXT,
  p_selected_alternative TEXT,
  p_correct_alternative TEXT,
  p_discipline TEXT DEFAULT NULL,
  p_year INT DEFAULT NULL,
  p_free_daily_limit INT DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
  v_is_correct BOOLEAN;
  v_is_pro BOOLEAN;
  v_current_count INT;
  v_result JSONB;
BEGIN
  v_is_correct := p_selected_alternative = p_correct_alternative;

  -- Check subscription (cache at app level for better perf)
  SELECT EXISTS(
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND plan = 'pro'
    AND expires_at > NOW()
  ) INTO v_is_pro;

  -- Check daily limit (only for non-pro)
  IF NOT v_is_pro THEN
    SELECT COALESCE(count, 0) INTO v_current_count
    FROM daily_usage
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    IF v_current_count >= p_free_daily_limit THEN
      RETURN jsonb_build_object(
        'error', 'Limite diário atingido',
        'limit_reached', true,
        'is_correct', null,
        'is_pro', false
      );
    END IF;

    -- Increment daily count
    INSERT INTO daily_usage (user_id, date, count)
    VALUES (p_user_id, CURRENT_DATE, v_current_count + 1)
    ON CONFLICT (user_id, date) DO UPDATE
    SET count = EXCLUDED.count + 1;
  END IF;

  -- Record answer
  INSERT INTO user_answers (
    user_id, question_id, selected_alternative,
    is_correct, discipline, year
  ) VALUES (
    p_user_id, p_question_id, p_selected_alternative,
    v_is_correct, p_discipline, p_year
  );

  -- Return result
  v_result := jsonb_build_object(
    'is_correct', v_is_correct,
    'is_pro', v_is_pro,
    'error', null
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION record_answer TO authenticated;
