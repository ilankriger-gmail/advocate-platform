-- Migration: Sistema de Moderação de Conteúdo com IA
-- Adiciona campos para moderação automática de posts

-- ============================================
-- Campos de moderação na tabela posts
-- ============================================

-- Score geral de moderação (0-1, maior = mais perigoso)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_score float DEFAULT NULL;

-- Flags detalhadas da moderação (JSON com scores por categoria)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_flags jsonb DEFAULT NULL;

-- Quando foi revisado pela moderação
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_reviewed_at timestamptz DEFAULT NULL;

-- Categoria do conteúdo: 'normal' ou 'money_request' (pedido de dinheiro)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_category text DEFAULT 'normal';

-- ============================================
-- Tabela de logs de moderação
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  decision text NOT NULL, -- 'approved', 'pending_review', 'blocked'
  score float NOT NULL,
  flags jsonb NOT NULL DEFAULT '{}',
  blocked_reasons text[] DEFAULT '{}',
  content_category text DEFAULT 'normal',
  processing_time_ms int DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índice para buscar logs por post
CREATE INDEX IF NOT EXISTS idx_moderation_logs_post_id ON moderation_logs(post_id);

-- Índice para filtrar posts por categoria de conteúdo
CREATE INDEX IF NOT EXISTS idx_posts_content_category ON posts(content_category) WHERE status = 'approved';

-- Índice para posts pendentes de revisão
CREATE INDEX IF NOT EXISTS idx_posts_pending_review ON posts(status, created_at) WHERE status = 'pending';

-- ============================================
-- Configurações de moderação no site_settings
-- ============================================

-- Inserir configurações padrão (apenas se não existirem)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES
  ('moderation_enabled', 'true', 'Moderação Automática', 'Ativar moderação automática de conteúdo com IA', 'boolean'),
  ('moderation_block_threshold', '0.7', 'Limite para Bloqueio', 'Score mínimo para bloquear conteúdo automaticamente (0-1)', 'number'),
  ('moderation_review_threshold', '0.3', 'Limite para Revisão', 'Score mínimo para enviar para revisão manual (0-1)', 'number')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Comentário explicativo
-- ============================================

COMMENT ON COLUMN posts.moderation_score IS 'Score de risco do conteúdo (0-1). Maior = mais perigoso';
COMMENT ON COLUMN posts.moderation_flags IS 'Detalhes da análise: nudity, weapon, drugs, toxicity, etc.';
COMMENT ON COLUMN posts.content_category IS 'Categoria: normal ou money_request (pedido de dinheiro)';
COMMENT ON TABLE moderation_logs IS 'Histórico de decisões de moderação para auditoria';
