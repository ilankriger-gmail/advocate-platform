-- Migration: Ranking relativo (5 acima + usuário + 5 abaixo)
-- Remove função de eventos e adiciona ranking relativo

-- ============================================
-- FUNÇÃO: RANKING RELATIVO POR MOEDAS
-- ============================================
CREATE OR REPLACE FUNCTION get_relative_coins_leaderboard(
  p_user_id UUID,
  p_range INT DEFAULT 5
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  score BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
WITH ranked AS (
  SELECT
    lc.user_id,
    lc.full_name,
    lc.avatar_url,
    lc.total_coins as score,
    lc.tier,
    ROW_NUMBER() OVER (ORDER BY lc.total_coins DESC) as rank
  FROM leaderboard_coins lc
),
user_position AS (
  SELECT rank FROM ranked WHERE ranked.user_id = p_user_id
)
SELECT r.user_id, r.full_name, r.avatar_url, r.score, r.tier, r.rank
FROM ranked r, user_position up
WHERE r.rank BETWEEN GREATEST(1, up.rank - p_range) AND (up.rank + p_range)
ORDER BY r.rank;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: RANKING RELATIVO COMBINADO
-- ============================================
CREATE OR REPLACE FUNCTION get_relative_combined_leaderboard(
  p_user_id UUID,
  p_range INT DEFAULT 5
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  score BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
WITH ranked AS (
  SELECT
    lc.user_id,
    lc.full_name,
    lc.avatar_url,
    lc.total_score as score,
    lc.tier,
    ROW_NUMBER() OVER (ORDER BY lc.total_score DESC) as rank
  FROM leaderboard_combined lc
),
user_position AS (
  SELECT rank FROM ranked WHERE ranked.user_id = p_user_id
)
SELECT r.user_id, r.full_name, r.avatar_url, r.score, r.tier, r.rank
FROM ranked r, user_position up
WHERE r.rank BETWEEN GREATEST(1, up.rank - p_range) AND (up.rank + p_range)
ORDER BY r.rank;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO: RANKING RELATIVO POR DESAFIOS
-- ============================================
CREATE OR REPLACE FUNCTION get_relative_challenges_leaderboard(
  p_user_id UUID,
  p_range INT DEFAULT 5
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  score BIGINT,
  tier TEXT,
  rank BIGINT
) AS $$
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
    u.id as user_id,
    u.full_name,
    u.avatar_url,
    COALESCE(uc.completed, 0) as score,
    CASE
      WHEN COALESCE(uc.completed, 0) >= 20 THEN 'diamond'
      WHEN COALESCE(uc.completed, 0) >= 10 THEN 'gold'
      WHEN COALESCE(uc.completed, 0) >= 5 THEN 'silver'
      ELSE 'bronze'
    END as tier,
    ROW_NUMBER() OVER (ORDER BY COALESCE(uc.completed, 0) DESC) as rank
  FROM users u
  LEFT JOIN user_challenges uc ON u.id = uc.user_id
  WHERE u.role = 'fan'
),
user_position AS (
  SELECT rank FROM ranked WHERE ranked.user_id = p_user_id
)
SELECT r.user_id, r.full_name, r.avatar_url, r.score, r.tier, r.rank
FROM ranked r, user_position up
WHERE r.rank BETWEEN GREATEST(1, up.rank - p_range) AND (up.rank + p_range)
ORDER BY r.rank;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- REMOVER FUNÇÃO DE EVENTOS (não mais usada)
-- ============================================
DROP FUNCTION IF EXISTS get_user_events_rank(UUID, TEXT);
