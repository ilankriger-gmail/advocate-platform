-- Migration: Índices de Performance para Lançamento
-- Otimiza queries mais frequentes para suportar 10-20k acessos/dia

-- ============================================
-- ÍNDICES PARA challenge_participants
-- ============================================

-- Índice para buscar participações por usuário
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user
  ON challenge_participants(user_id);

-- Índice para buscar participantes por desafio
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge
  ON challenge_participants(challenge_id);

-- Índice para buscar participações recentes (ordenado)
CREATE INDEX IF NOT EXISTS idx_challenge_participants_created
  ON challenge_participants(created_at DESC);

-- Índice composto para queries de status por usuário
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_status
  ON challenge_participants(user_id, status);

-- Índice para desafios aprovados (muito usado em rankings)
CREATE INDEX IF NOT EXISTS idx_challenge_participants_approved
  ON challenge_participants(approved_at DESC)
  WHERE status = 'approved';

-- ============================================
-- ÍNDICES PARA coin_transactions
-- ============================================

-- Índice para buscar transações por usuário
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user
  ON coin_transactions(user_id);

-- Índice para buscar transações recentes (ordenado)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created
  ON coin_transactions(created_at DESC);

-- Índice para transações de ganho (usado em leaderboards)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_earned
  ON coin_transactions(user_id, amount)
  WHERE type = 'earned';

-- ============================================
-- ÍNDICES PARA posts
-- ============================================

-- Índice composto para buscar posts de um usuário (ordenado)
CREATE INDEX IF NOT EXISTS idx_posts_user_created
  ON posts(user_id, created_at DESC);

-- Índice para feed público (posts aprovados)
CREATE INDEX IF NOT EXISTS idx_posts_feed_approved
  ON posts(created_at DESC)
  WHERE status = 'approved';

-- ============================================
-- ÍNDICES PARA event_registrations
-- ============================================

-- Índice para buscar registros por usuário
CREATE INDEX IF NOT EXISTS idx_event_registrations_user
  ON event_registrations(user_id);

-- Índice para buscar registros por evento
CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations(event_id);

-- Índice para check-ins (muito usado em analytics)
CREATE INDEX IF NOT EXISTS idx_event_registrations_checkin
  ON event_registrations(check_in_time DESC)
  WHERE check_in_time IS NOT NULL;

-- ============================================
-- ÍNDICES PARA redemptions
-- ============================================

-- Índice para buscar resgates por usuário
CREATE INDEX IF NOT EXISTS idx_redemptions_user
  ON redemptions(user_id);

-- Índice para buscar resgates recentes
CREATE INDEX IF NOT EXISTS idx_redemptions_created
  ON redemptions(created_at DESC);

-- ============================================
-- ÍNDICES PARA users (complementares)
-- ============================================

-- Índice para buscar usuários por role (usado em analytics)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role)
  WHERE role = 'user';

-- Índice para usuários recentes (cadastros)
CREATE INDEX IF NOT EXISTS idx_users_created
  ON users(created_at DESC);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON INDEX idx_challenge_participants_user IS 'Busca participações por usuário (perfil, histórico)';
COMMENT ON INDEX idx_challenge_participants_challenge IS 'Busca participantes de um desafio específico';
COMMENT ON INDEX idx_challenge_participants_approved IS 'Desafios aprovados para cálculo de ranking';
COMMENT ON INDEX idx_coin_transactions_user IS 'Histórico de transações do usuário';
COMMENT ON INDEX idx_coin_transactions_earned IS 'Transações de ganho para leaderboard semanal/mensal';
COMMENT ON INDEX idx_posts_user_created IS 'Posts do usuário ordenados por data';
COMMENT ON INDEX idx_posts_feed_approved IS 'Feed público com posts aprovados';
