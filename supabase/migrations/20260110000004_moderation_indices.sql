-- Migration: Indices para Sistema de Moderacao
-- Melhora performance das queries no painel admin

-- ============================================
-- Indice para posts bloqueados (admin)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_blocked
  ON posts(status, created_at DESC)
  WHERE status = 'blocked';

-- ============================================
-- Indice para pedidos de ajuda (admin + feed)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_help_request_admin
  ON posts(content_category, status, created_at DESC)
  WHERE content_category = 'help_request';

-- ============================================
-- Indice para posts pendentes (admin)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_posts_pending_admin
  ON posts(status, created_at DESC)
  WHERE status = 'pending';

-- ============================================
-- Comentarios
-- ============================================
COMMENT ON INDEX idx_posts_blocked IS 'Posts bloqueados pela moderacao automatica (IA)';
COMMENT ON INDEX idx_posts_help_request_admin IS 'Posts classificados como pedidos de ajuda';
COMMENT ON INDEX idx_posts_pending_admin IS 'Posts aguardando revisao manual';
