-- =============================================
-- MIGRACAO: Sistema de Leaderboards e Rankings
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- =============================================
-- FUNCAO: Calcular tier do usuario
-- =============================================
-- Tiers: Bronze (0-99), Silver (100-499), Gold (500-999), Diamond (1000+)
CREATE OR REPLACE FUNCTION get_user_tier(total_score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF total_score >= 1000 THEN
    RETURN 'diamond';
  ELSIF total_score >= 500 THEN
    RETURN 'gold';
  ELSIF total_score >= 100 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- VIEW: Leaderboard de Moedas (Coins)
-- =============================================
-- Agregacao de moedas com filtros de tempo e tier
CREATE OR REPLACE VIEW leaderboard_coins AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  COALESCE(uc.balance, 0) AS total_coins,
  get_user_tier(COALESCE(uc.balance, 0)) AS tier,
  uc.updated_at AS last_activity
FROM users u
LEFT JOIN user_coins uc ON uc.user_id = u.id
WHERE u.role = 'fan' OR u.is_creator = false
ORDER BY total_coins DESC;

-- =============================================
-- VIEW: Leaderboard de Desafios Completados
-- =============================================
-- Conta desafios aprovados por usuario
CREATE OR REPLACE VIEW leaderboard_challenges AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  COUNT(cp.id) AS challenges_completed,
  COALESCE(SUM(cp.coins_earned), 0) AS total_coins_from_challenges,
  get_user_tier(COALESCE(SUM(cp.coins_earned), 0)) AS tier,
  MAX(cp.approved_at) AS last_activity
FROM users u
LEFT JOIN challenge_participants cp ON cp.user_id = u.id AND cp.status = 'approved'
WHERE u.role = 'fan' OR u.is_creator = false
GROUP BY u.id, u.full_name, u.avatar_url
ORDER BY challenges_completed DESC, total_coins_from_challenges DESC;

-- =============================================
-- VIEW: Leaderboard de Eventos Atendidos
-- =============================================
-- Conta eventos com check-in realizado
CREATE OR REPLACE VIEW leaderboard_events AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  COUNT(er.id) AS events_attended,
  MAX(er.check_in_time) AS last_activity
FROM users u
LEFT JOIN event_registrations er ON er.user_id = u.id
  AND er.check_in_time IS NOT NULL
  AND er.status != 'cancelled'
WHERE u.role = 'fan' OR u.is_creator = false
GROUP BY u.id, u.full_name, u.avatar_url
ORDER BY events_attended DESC;

-- =============================================
-- VIEW: Leaderboard Combinado (Overall)
-- =============================================
-- Pontuacao geral combinando todas as atividades
CREATE OR REPLACE VIEW leaderboard_combined AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  COALESCE(uc.balance, 0) AS total_coins,
  COALESCE(challenges.challenges_completed, 0) AS challenges_completed,
  COALESCE(events.events_attended, 0) AS events_attended,
  -- Score combinado: coins + (challenges * 50) + (events * 30)
  COALESCE(uc.balance, 0) +
  COALESCE(challenges.challenges_completed, 0) * 50 +
  COALESCE(events.events_attended, 0) * 30 AS total_score,
  get_user_tier(
    COALESCE(uc.balance, 0) +
    COALESCE(challenges.challenges_completed, 0) * 50 +
    COALESCE(events.events_attended, 0) * 30
  ) AS tier,
  GREATEST(
    COALESCE(uc.updated_at, '1970-01-01'::timestamptz),
    COALESCE(challenges.last_activity, '1970-01-01'::timestamptz),
    COALESCE(events.last_activity, '1970-01-01'::timestamptz)
  ) AS last_activity
FROM users u
LEFT JOIN user_coins uc ON uc.user_id = u.id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(id) AS challenges_completed,
    MAX(approved_at) AS last_activity
  FROM challenge_participants
  WHERE status = 'approved'
  GROUP BY user_id
) challenges ON challenges.user_id = u.id
LEFT JOIN (
  SELECT
    user_id,
    COUNT(id) AS events_attended,
    MAX(check_in_time) AS last_activity
  FROM event_registrations
  WHERE check_in_time IS NOT NULL AND status != 'cancelled'
  GROUP BY user_id
) events ON events.user_id = u.id
WHERE u.role = 'fan' OR u.is_creator = false
ORDER BY total_score DESC;

-- =============================================
-- FUNCAO: Obter ranking do usuario em coins
-- =============================================
CREATE OR REPLACE FUNCTION get_user_coins_rank(p_user_id UUID, p_period TEXT DEFAULT 'all_time')
RETURNS TABLE(
  rank_position BIGINT,
  total_coins INTEGER,
  tier TEXT,
  total_users BIGINT
) AS $$
BEGIN
  -- Validar periodo
  IF p_period NOT IN ('weekly', 'monthly', 'all_time') THEN
    RAISE EXCEPTION 'Invalid period. Must be weekly, monthly, or all_time';
  END IF;

  -- Ranking all-time
  IF p_period = 'all_time' THEN
    RETURN QUERY
    WITH ranked_users AS (
      SELECT
        lc.user_id,
        lc.total_coins,
        lc.tier,
        ROW_NUMBER() OVER (ORDER BY lc.total_coins DESC) AS rank
      FROM leaderboard_coins lc
    ),
    total_count AS (
      SELECT COUNT(*) AS total FROM ranked_users
    )
    SELECT
      ru.rank,
      ru.total_coins,
      ru.tier,
      tc.total
    FROM ranked_users ru, total_count tc
    WHERE ru.user_id = p_user_id;
    RETURN;
  END IF;

  -- Ranking com filtro de tempo (weekly ou monthly)
  RETURN QUERY
  WITH time_filtered_coins AS (
    SELECT
      ct.user_id,
      SUM(CASE WHEN ct.type = 'earned' THEN ct.amount ELSE 0 END) AS coins_earned
    FROM coin_transactions ct
    WHERE ct.created_at >= (
      CASE
        WHEN p_period = 'weekly' THEN NOW() - INTERVAL '7 days'
        WHEN p_period = 'monthly' THEN NOW() - INTERVAL '30 days'
      END
    )
    GROUP BY ct.user_id
  ),
  ranked_users AS (
    SELECT
      u.id AS user_id,
      COALESCE(tfc.coins_earned, 0)::INTEGER AS total_coins,
      get_user_tier(COALESCE(tfc.coins_earned, 0)::INTEGER) AS tier,
      ROW_NUMBER() OVER (ORDER BY COALESCE(tfc.coins_earned, 0) DESC) AS rank
    FROM users u
    LEFT JOIN time_filtered_coins tfc ON tfc.user_id = u.id
    WHERE u.role = 'fan' OR u.is_creator = false
  ),
  total_count AS (
    SELECT COUNT(*) AS total FROM ranked_users
  )
  SELECT
    ru.rank,
    ru.total_coins,
    ru.tier,
    tc.total
  FROM ranked_users ru, total_count tc
  WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- FUNCAO: Obter ranking do usuario em desafios
-- =============================================
CREATE OR REPLACE FUNCTION get_user_challenges_rank(p_user_id UUID, p_period TEXT DEFAULT 'all_time')
RETURNS TABLE(
  rank_position BIGINT,
  challenges_completed BIGINT,
  total_coins_from_challenges BIGINT,
  tier TEXT,
  total_users BIGINT
) AS $$
BEGIN
  IF p_period NOT IN ('weekly', 'monthly', 'all_time') THEN
    RAISE EXCEPTION 'Invalid period. Must be weekly, monthly, or all_time';
  END IF;

  RETURN QUERY
  WITH time_filtered_challenges AS (
    SELECT
      cp.user_id,
      COUNT(cp.id) AS completed,
      SUM(cp.coins_earned) AS coins
    FROM challenge_participants cp
    WHERE cp.status = 'approved'
      AND (
        p_period = 'all_time' OR
        (p_period = 'weekly' AND cp.approved_at >= NOW() - INTERVAL '7 days') OR
        (p_period = 'monthly' AND cp.approved_at >= NOW() - INTERVAL '30 days')
      )
    GROUP BY cp.user_id
  ),
  ranked_users AS (
    SELECT
      u.id AS user_id,
      COALESCE(tfc.completed, 0) AS completed,
      COALESCE(tfc.coins, 0) AS coins,
      get_user_tier(COALESCE(tfc.coins, 0)::INTEGER) AS tier,
      ROW_NUMBER() OVER (ORDER BY COALESCE(tfc.completed, 0) DESC, COALESCE(tfc.coins, 0) DESC) AS rank
    FROM users u
    LEFT JOIN time_filtered_challenges tfc ON tfc.user_id = u.id
    WHERE u.role = 'fan' OR u.is_creator = false
  ),
  total_count AS (
    SELECT COUNT(*) AS total FROM ranked_users
  )
  SELECT
    ru.rank,
    ru.completed,
    ru.coins,
    ru.tier,
    tc.total
  FROM ranked_users ru, total_count tc
  WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- FUNCAO: Obter ranking do usuario em eventos
-- =============================================
CREATE OR REPLACE FUNCTION get_user_events_rank(p_user_id UUID, p_period TEXT DEFAULT 'all_time')
RETURNS TABLE(
  rank_position BIGINT,
  events_attended BIGINT,
  total_users BIGINT
) AS $$
BEGIN
  IF p_period NOT IN ('weekly', 'monthly', 'all_time') THEN
    RAISE EXCEPTION 'Invalid period. Must be weekly, monthly, or all_time';
  END IF;

  RETURN QUERY
  WITH time_filtered_events AS (
    SELECT
      er.user_id,
      COUNT(er.id) AS attended
    FROM event_registrations er
    WHERE er.check_in_time IS NOT NULL
      AND er.status != 'cancelled'
      AND (
        p_period = 'all_time' OR
        (p_period = 'weekly' AND er.check_in_time >= NOW() - INTERVAL '7 days') OR
        (p_period = 'monthly' AND er.check_in_time >= NOW() - INTERVAL '30 days')
      )
    GROUP BY er.user_id
  ),
  ranked_users AS (
    SELECT
      u.id AS user_id,
      COALESCE(tfe.attended, 0) AS attended,
      ROW_NUMBER() OVER (ORDER BY COALESCE(tfe.attended, 0) DESC) AS rank
    FROM users u
    LEFT JOIN time_filtered_events tfe ON tfe.user_id = u.id
    WHERE u.role = 'fan' OR u.is_creator = false
  ),
  total_count AS (
    SELECT COUNT(*) AS total FROM ranked_users
  )
  SELECT
    ru.rank,
    ru.attended,
    tc.total
  FROM ranked_users ru, total_count tc
  WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- FUNCAO: Obter ranking combinado do usuario
-- =============================================
CREATE OR REPLACE FUNCTION get_user_combined_rank(p_user_id UUID, p_period TEXT DEFAULT 'all_time')
RETURNS TABLE(
  rank_position BIGINT,
  total_score BIGINT,
  total_coins INTEGER,
  challenges_completed BIGINT,
  events_attended BIGINT,
  tier TEXT,
  total_users BIGINT
) AS $$
BEGIN
  IF p_period NOT IN ('weekly', 'monthly', 'all_time') THEN
    RAISE EXCEPTION 'Invalid period. Must be weekly, monthly, or all_time';
  END IF;

  -- Ranking all-time usa a view pre-calculada
  IF p_period = 'all_time' THEN
    RETURN QUERY
    WITH ranked_users AS (
      SELECT
        lc.user_id,
        lc.total_score,
        lc.total_coins,
        lc.challenges_completed,
        lc.events_attended,
        lc.tier,
        ROW_NUMBER() OVER (ORDER BY lc.total_score DESC) AS rank
      FROM leaderboard_combined lc
    ),
    total_count AS (
      SELECT COUNT(*) AS total FROM ranked_users
    )
    SELECT
      ru.rank,
      ru.total_score,
      ru.total_coins,
      ru.challenges_completed,
      ru.events_attended,
      ru.tier,
      tc.total
    FROM ranked_users ru, total_count tc
    WHERE ru.user_id = p_user_id;
    RETURN;
  END IF;

  -- Ranking com filtro de tempo
  RETURN QUERY
  WITH time_filtered_data AS (
    SELECT
      u.id AS user_id,
      COALESCE(coins.coins_earned, 0) AS coins,
      COALESCE(challenges.completed, 0) AS challenges,
      COALESCE(events.attended, 0) AS events
    FROM users u
    LEFT JOIN (
      SELECT
        user_id,
        SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END) AS coins_earned
      FROM coin_transactions
      WHERE created_at >= (
        CASE
          WHEN p_period = 'weekly' THEN NOW() - INTERVAL '7 days'
          WHEN p_period = 'monthly' THEN NOW() - INTERVAL '30 days'
        END
      )
      GROUP BY user_id
    ) coins ON coins.user_id = u.id
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(id) AS completed
      FROM challenge_participants
      WHERE status = 'approved'
        AND approved_at >= (
          CASE
            WHEN p_period = 'weekly' THEN NOW() - INTERVAL '7 days'
            WHEN p_period = 'monthly' THEN NOW() - INTERVAL '30 days'
          END
        )
      GROUP BY user_id
    ) challenges ON challenges.user_id = u.id
    LEFT JOIN (
      SELECT
        user_id,
        COUNT(id) AS attended
      FROM event_registrations
      WHERE check_in_time IS NOT NULL
        AND status != 'cancelled'
        AND check_in_time >= (
          CASE
            WHEN p_period = 'weekly' THEN NOW() - INTERVAL '7 days'
            WHEN p_period = 'monthly' THEN NOW() - INTERVAL '30 days'
          END
        )
      GROUP BY user_id
    ) events ON events.user_id = u.id
    WHERE u.role = 'fan' OR u.is_creator = false
  ),
  ranked_users AS (
    SELECT
      tfd.user_id,
      (tfd.coins + tfd.challenges * 50 + tfd.events * 30) AS score,
      tfd.coins::INTEGER AS coins,
      tfd.challenges,
      tfd.events,
      get_user_tier((tfd.coins + tfd.challenges * 50 + tfd.events * 30)::INTEGER) AS tier,
      ROW_NUMBER() OVER (ORDER BY (tfd.coins + tfd.challenges * 50 + tfd.events * 30) DESC) AS rank
    FROM time_filtered_data tfd
  ),
  total_count AS (
    SELECT COUNT(*) AS total FROM ranked_users
  )
  SELECT
    ru.rank,
    ru.score,
    ru.coins,
    ru.challenges,
    ru.events,
    ru.tier,
    tc.total
  FROM ranked_users ru, total_count tc
  WHERE ru.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================
-- RLS: Politicas de acesso publico aos leaderboards
-- =============================================

-- CONTEXTO: Views nao suportam RLS diretamente, mas as tabelas
-- subjacentes (users, user_coins, challenge_participants, event_registrations,
-- coin_transactions) precisam de politicas que permitam leitura para leaderboards
-- enquanto protegem informacoes sensiveis.

-- ESTRATEGIA DE SEGURANCA:
-- 1. Permitir leitura autenticada de dados publicos (rankings, scores)
-- 2. Proteger informacoes sensiveis (email, telefone, enderecos)
-- 3. Mostrar apenas dados aprovados/publicos
-- 4. Views ja filtram por role (apenas fans, nao creators)

-- =============================================
-- POLITICA 1: Perfis de usuarios visiveis
-- =============================================
-- Permite que usuarios autenticados vejam perfis basicos
-- para exibicao nos leaderboards (nome, avatar)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'users_viewable_by_authenticated'
  ) THEN
    CREATE POLICY "users_viewable_by_authenticated" ON users
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- POLITICA 2: Saldos de moedas para leaderboard
-- =============================================
-- Permite que usuarios autenticados vejam saldos de todos
-- para calcular rankings. O saldo eh publico no contexto do leaderboard.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_coins'
    AND policyname = 'user_coins_leaderboard_viewable'
  ) THEN
    CREATE POLICY "user_coins_leaderboard_viewable" ON user_coins
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- POLITICA 3: Transacoes de moedas para filtros temporais
-- =============================================
-- Permite leitura de transacoes para calcular rankings por periodo
-- (semanal, mensal). Necessario para funcoes get_user_*_rank com time filters.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coin_transactions'
    AND policyname = 'coin_transactions_leaderboard_viewable'
  ) THEN
    CREATE POLICY "coin_transactions_leaderboard_viewable" ON coin_transactions
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- =============================================
-- POLITICA 4: Participacoes aprovadas em desafios
-- =============================================
-- Garante que participacoes aprovadas sejam visiveis para leaderboard
-- (pode ja existir em challenges-v2-setup.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenge_participants'
    AND policyname = 'challenge_participants_leaderboard_viewable'
  ) THEN
    CREATE POLICY "challenge_participants_leaderboard_viewable" ON challenge_participants
      FOR SELECT TO authenticated
      USING (status = 'approved');
  END IF;
END $$;

-- =============================================
-- POLITICA 5: Registros de eventos para leaderboard
-- =============================================
-- Permite leitura de check-ins em eventos para calcular leaderboard
-- de eventos atendidos. Apenas eventos com check-in confirmado.
DO $$
BEGIN
  -- Primeiro verificar se a tabela existe
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_registrations') THEN
    -- Habilitar RLS se ainda nao estiver
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE tablename = 'event_registrations'
      AND rowsecurity = true
    ) THEN
      ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Criar politica de leitura
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'event_registrations'
      AND policyname = 'event_registrations_leaderboard_viewable'
    ) THEN
      CREATE POLICY "event_registrations_leaderboard_viewable" ON event_registrations
        FOR SELECT TO authenticated
        USING (check_in_time IS NOT NULL AND status != 'cancelled');
    END IF;
  END IF;
END $$;

-- =============================================
-- NOTA IMPORTANTE SOBRE PROTECAO DE DADOS
-- =============================================
-- As politicas acima permitem leitura ampla de dados de gamificacao,
-- mas as VIEWS (leaderboard_*) fazem a filtragem adicional:
-- - SELECT apenas colunas relevantes (full_name, avatar_url, scores)
-- - NAO expoe dados sensiveis (email, phone, address, etc)
-- - Filtra apenas usuarios com role = 'fan'
--
-- Se a tabela 'users' contiver colunas sensiveis, considere:
-- 1. Usar SELECT especifico nas queries (ja feito nas views)
-- 2. Adicionar USING clause mais restritiva se necessario
-- 3. Criar view separada com apenas colunas publicas

-- =============================================
-- INDICES para performance
-- =============================================

-- Indices para user_coins
CREATE INDEX IF NOT EXISTS idx_user_coins_balance ON user_coins(balance DESC);
CREATE INDEX IF NOT EXISTS idx_user_coins_updated_at ON user_coins(updated_at DESC);

-- Indices para challenge_participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_status ON challenge_participants(status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_approved_at ON challenge_participants(approved_at DESC) WHERE status = 'approved';

-- Indices para event_registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_checkin ON event_registrations(check_in_time DESC) WHERE check_in_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- Indices para coin_transactions (para filtros de tempo)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_date ON coin_transactions(user_id, created_at DESC);

-- =============================================
-- FIM DA MIGRACAO
-- =============================================

-- Para testar:
-- SELECT * FROM leaderboard_coins LIMIT 10;
-- SELECT * FROM leaderboard_challenges LIMIT 10;
-- SELECT * FROM leaderboard_events LIMIT 10;
-- SELECT * FROM leaderboard_combined LIMIT 10;
-- SELECT * FROM get_user_coins_rank('user-uuid-here', 'all_time');
-- SELECT * FROM get_user_challenges_rank('user-uuid-here', 'weekly');
-- SELECT * FROM get_user_events_rank('user-uuid-here', 'monthly');
-- SELECT * FROM get_user_combined_rank('user-uuid-here', 'all_time');
