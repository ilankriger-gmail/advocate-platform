-- Migration: Criar views e funções para leaderboard/ranking
-- Bug: Página /ranking não carregava por falta das views

-- ============================================
-- VIEWS PARA LEADERBOARD
-- ============================================

-- View: Ranking por moedas (usa tabela user_coins)
CREATE OR REPLACE VIEW leaderboard_coins AS
SELECT
  u.id as user_id,
  u.full_name,
  u.avatar_url,
  COALESCE(uc.balance, 0) as total_coins,
  CASE
    WHEN COALESCE(uc.balance, 0) >= 1000 THEN 'diamond'
    WHEN COALESCE(uc.balance, 0) >= 500 THEN 'gold'
    WHEN COALESCE(uc.balance, 0) >= 100 THEN 'silver'
    ELSE 'bronze'
  END as tier,
  u.updated_at as last_activity
FROM users u
LEFT JOIN user_coins uc ON u.id = uc.user_id
WHERE u.role = 'user'
ORDER BY total_coins DESC;

-- View: Ranking combinado (geral)
CREATE OR REPLACE VIEW leaderboard_combined AS
SELECT
  u.id as user_id,
  u.full_name,
  u.avatar_url,
  COALESCE(uc.balance, 0) as total_score,
  CASE
    WHEN COALESCE(uc.balance, 0) >= 1000 THEN 'diamond'
    WHEN COALESCE(uc.balance, 0) >= 500 THEN 'gold'
    WHEN COALESCE(uc.balance, 0) >= 100 THEN 'silver'
    ELSE 'bronze'
  END as tier,
  u.updated_at as last_activity
FROM users u
LEFT JOIN user_coins uc ON u.id = uc.user_id
WHERE u.role = 'user'
ORDER BY total_score DESC;

-- ============================================
-- FUNÇÕES PARA RANKING DO USUÁRIO
-- ============================================

-- Função: Ranking do usuário por moedas
CREATE OR REPLACE FUNCTION get_user_coins_rank(p_user_id UUID, p_period TEXT)
RETURNS TABLE(rank_position BIGINT, total_coins BIGINT, tier TEXT, total_users BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      u.id,
      COALESCE(uc.balance, 0) as coins,
      ROW_NUMBER() OVER (ORDER BY COALESCE(uc.balance, 0) DESC) as rn
    FROM users u
    LEFT JOIN user_coins uc ON u.id = uc.user_id
    WHERE u.role = 'user'
  )
  SELECT
    r.rn as rank_position,
    r.coins as total_coins,
    CASE
      WHEN r.coins >= 1000 THEN 'diamond'
      WHEN r.coins >= 500 THEN 'gold'
      WHEN r.coins >= 100 THEN 'silver'
      ELSE 'bronze'
    END as tier,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
  FROM ranked r
  WHERE r.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Ranking do usuário combinado
CREATE OR REPLACE FUNCTION get_user_combined_rank(p_user_id UUID, p_period TEXT)
RETURNS TABLE(rank_position BIGINT, total_score BIGINT, tier TEXT, total_users BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH ranked AS (
    SELECT
      u.id,
      COALESCE(uc.balance, 0) as score,
      ROW_NUMBER() OVER (ORDER BY COALESCE(uc.balance, 0) DESC) as rn
    FROM users u
    LEFT JOIN user_coins uc ON u.id = uc.user_id
    WHERE u.role = 'user'
  )
  SELECT
    r.rn as rank_position,
    r.score as total_score,
    CASE
      WHEN r.score >= 1000 THEN 'diamond'
      WHEN r.score >= 500 THEN 'gold'
      WHEN r.score >= 100 THEN 'silver'
      ELSE 'bronze'
    END as tier,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
  FROM ranked r
  WHERE r.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Ranking do usuário por desafios
CREATE OR REPLACE FUNCTION get_user_challenges_rank(p_user_id UUID, p_period TEXT)
RETURNS TABLE(rank_position BIGINT, challenges_completed BIGINT, tier TEXT, total_users BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH user_challenges AS (
    SELECT
      user_id,
      COUNT(*) as completed
    FROM challenge_participants
    WHERE status = 'approved'
    GROUP BY user_id
  ),
  ranked AS (
    SELECT
      u.id,
      COALESCE(uch.completed, 0) as challenges,
      ROW_NUMBER() OVER (ORDER BY COALESCE(uch.completed, 0) DESC) as rn
    FROM users u
    LEFT JOIN user_challenges uch ON u.id = uch.user_id
    WHERE u.role = 'user'
  )
  SELECT
    r.rn as rank_position,
    r.challenges as challenges_completed,
    CASE
      WHEN r.challenges >= 20 THEN 'diamond'
      WHEN r.challenges >= 10 THEN 'gold'
      WHEN r.challenges >= 5 THEN 'silver'
      ELSE 'bronze'
    END as tier,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
  FROM ranked r
  WHERE r.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: Ranking do usuário por eventos
CREATE OR REPLACE FUNCTION get_user_events_rank(p_user_id UUID, p_period TEXT)
RETURNS TABLE(rank_position BIGINT, events_attended BIGINT, tier TEXT, total_users BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH user_events AS (
    SELECT
      user_id,
      COUNT(*) as attended
    FROM event_registrations
    WHERE check_in_time IS NOT NULL AND status != 'cancelled'
    GROUP BY user_id
  ),
  ranked AS (
    SELECT
      u.id,
      COALESCE(ue.attended, 0) as events,
      ROW_NUMBER() OVER (ORDER BY COALESCE(ue.attended, 0) DESC) as rn
    FROM users u
    LEFT JOIN user_events ue ON u.id = ue.user_id
    WHERE u.role = 'user'
  )
  SELECT
    r.rn as rank_position,
    r.events as events_attended,
    CASE
      WHEN r.events >= 20 THEN 'diamond'
      WHEN r.events >= 10 THEN 'gold'
      WHEN r.events >= 5 THEN 'silver'
      ELSE 'bronze'
    END as tier,
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users
  FROM ranked r
  WHERE r.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
