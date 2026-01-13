-- Migration: Funções SQL otimizadas para Leaderboard
-- Evita agregação client-side para rankings semanais/mensais

-- ============================================
-- Função: Leaderboard de moedas por período
-- Retorna top N usuários por moedas ganhas no período
-- ============================================
CREATE OR REPLACE FUNCTION get_coins_leaderboard_by_period(
  p_period TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_coins BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calcular data de início baseado no período
  IF p_period = 'weekly' THEN
    v_start_date := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'monthly' THEN
    v_start_date := NOW() - INTERVAL '30 days';
  ELSE
    -- all_time: usar view existente
    RETURN QUERY
    SELECT
      lc.user_id,
      lc.full_name,
      lc.avatar_url,
      lc.total_coins::BIGINT,
      lc.tier,
      ROW_NUMBER() OVER (ORDER BY lc.total_coins DESC)::BIGINT as rank
    FROM leaderboard_coins lc
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Para weekly/monthly: agregar transações do período
  RETURN QUERY
  WITH user_coins AS (
    SELECT
      ct.user_id,
      SUM(ct.amount) as coins_earned
    FROM coin_transactions ct
    WHERE ct.type = 'earned'
      AND ct.created_at >= v_start_date
    GROUP BY ct.user_id
  ),
  ranked AS (
    SELECT
      uc.user_id,
      uc.coins_earned,
      ROW_NUMBER() OVER (ORDER BY uc.coins_earned DESC) as rn
    FROM user_coins uc
    WHERE uc.coins_earned > 0
  )
  SELECT
    r.user_id,
    u.full_name,
    u.avatar_url,
    r.coins_earned::BIGINT as total_coins,
    CASE
      WHEN r.coins_earned >= 1000 THEN 'diamond'
      WHEN r.coins_earned >= 500 THEN 'gold'
      WHEN r.coins_earned >= 100 THEN 'silver'
      ELSE 'bronze'
    END::TEXT as tier,
    r.rn::BIGINT as rank
  FROM ranked r
  JOIN users u ON u.id = r.user_id
  WHERE r.rn <= p_limit
  ORDER BY r.rn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função: Leaderboard de desafios por período
-- Retorna top N usuários por desafios completados
-- ============================================
CREATE OR REPLACE FUNCTION get_challenges_leaderboard_by_period(
  p_period TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  challenges_completed BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calcular data de início baseado no período
  IF p_period = 'weekly' THEN
    v_start_date := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'monthly' THEN
    v_start_date := NOW() - INTERVAL '30 days';
  ELSE
    v_start_date := '1970-01-01'::TIMESTAMPTZ; -- all_time
  END IF;

  RETURN QUERY
  WITH user_challenges AS (
    SELECT
      cp.user_id,
      COUNT(*) as completed
    FROM challenge_participants cp
    WHERE cp.status = 'approved'
      AND (p_period = 'all_time' OR cp.approved_at >= v_start_date)
    GROUP BY cp.user_id
  ),
  ranked AS (
    SELECT
      uc.user_id,
      uc.completed,
      ROW_NUMBER() OVER (ORDER BY uc.completed DESC) as rn
    FROM user_challenges uc
    WHERE uc.completed > 0
  )
  SELECT
    r.user_id,
    u.full_name,
    u.avatar_url,
    r.completed::BIGINT as challenges_completed,
    CASE
      WHEN r.completed >= 20 THEN 'diamond'
      WHEN r.completed >= 10 THEN 'gold'
      WHEN r.completed >= 5 THEN 'silver'
      ELSE 'bronze'
    END::TEXT as tier,
    r.rn::BIGINT as rank
  FROM ranked r
  JOIN users u ON u.id = r.user_id
  WHERE r.rn <= p_limit
  ORDER BY r.rn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Função: Leaderboard combinado por período
-- Retorna top N usuários por pontuação total
-- ============================================
CREATE OR REPLACE FUNCTION get_combined_leaderboard_by_period(
  p_period TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  total_score BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Calcular data de início baseado no período
  IF p_period = 'weekly' THEN
    v_start_date := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'monthly' THEN
    v_start_date := NOW() - INTERVAL '30 days';
  ELSE
    -- all_time: usar view existente
    RETURN QUERY
    SELECT
      lc.user_id,
      lc.full_name,
      lc.avatar_url,
      lc.total_score::BIGINT,
      lc.tier,
      ROW_NUMBER() OVER (ORDER BY lc.total_score DESC)::BIGINT as rank
    FROM leaderboard_combined lc
    LIMIT p_limit;
    RETURN;
  END IF;

  -- Para weekly/monthly: combinar moedas + desafios + eventos
  RETURN QUERY
  WITH user_scores AS (
    -- Moedas ganhas
    SELECT
      ct.user_id,
      SUM(ct.amount) as score
    FROM coin_transactions ct
    WHERE ct.type = 'earned'
      AND ct.created_at >= v_start_date
    GROUP BY ct.user_id

    UNION ALL

    -- Pontos de desafios (50 cada)
    SELECT
      cp.user_id,
      COUNT(*) * 50 as score
    FROM challenge_participants cp
    WHERE cp.status = 'approved'
      AND cp.approved_at >= v_start_date
    GROUP BY cp.user_id

    UNION ALL

    -- Pontos de eventos (30 cada)
    SELECT
      er.user_id,
      COUNT(*) * 30 as score
    FROM event_registrations er
    WHERE er.check_in_time IS NOT NULL
      AND er.status != 'cancelled'
      AND er.check_in_time >= v_start_date
    GROUP BY er.user_id
  ),
  aggregated AS (
    SELECT
      us.user_id,
      SUM(us.score) as total
    FROM user_scores us
    GROUP BY us.user_id
  ),
  ranked AS (
    SELECT
      a.user_id,
      a.total,
      ROW_NUMBER() OVER (ORDER BY a.total DESC) as rn
    FROM aggregated a
    WHERE a.total > 0
  )
  SELECT
    r.user_id,
    u.full_name,
    u.avatar_url,
    r.total::BIGINT as total_score,
    CASE
      WHEN r.total >= 1000 THEN 'diamond'
      WHEN r.total >= 500 THEN 'gold'
      WHEN r.total >= 100 THEN 'silver'
      ELSE 'bronze'
    END::TEXT as tier,
    r.rn::BIGINT as rank
  FROM ranked r
  JOIN users u ON u.id = r.user_id
  WHERE r.rn <= p_limit
  ORDER BY r.rn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comentários
-- ============================================
COMMENT ON FUNCTION get_coins_leaderboard_by_period IS 'Retorna ranking de moedas ganhas no período especificado';
COMMENT ON FUNCTION get_challenges_leaderboard_by_period IS 'Retorna ranking de desafios completados no período especificado';
COMMENT ON FUNCTION get_combined_leaderboard_by_period IS 'Retorna ranking combinado (moedas + desafios + eventos) no período especificado';
