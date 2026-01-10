-- Migration: Sistema de Detecção de Pedidos de Ajuda
-- Adiciona categoria de conteúdo para separar posts normais de pedidos de ajuda

-- ============================================
-- Coluna content_category na tabela posts
-- ============================================

-- Adicionar coluna se não existir
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_category text DEFAULT 'normal';

-- Atualizar posts existentes que não têm categoria
UPDATE posts SET content_category = 'normal' WHERE content_category IS NULL;

-- ============================================
-- Índice para filtrar posts por categoria
-- ============================================

-- Índice para buscar posts aprovados por categoria (usado no feed)
CREATE INDEX IF NOT EXISTS idx_posts_content_category
  ON posts(content_category, status, created_at DESC)
  WHERE status = 'approved';

-- ============================================
-- Comentários
-- ============================================

COMMENT ON COLUMN posts.content_category IS 'Categoria do conteúdo: normal (posts comuns) ou help_request (pedidos de ajuda)';
