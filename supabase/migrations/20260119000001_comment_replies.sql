-- =====================================================
-- MIGRAÇÃO: Adicionar suporte a respostas em comentários
-- =====================================================

-- Adicionar coluna parent_id para comentários aninhados
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;

-- Índice para buscar respostas de um comentário
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON post_comments(parent_id);

-- Índice composto para buscar comentários raiz de um post
CREATE INDEX IF NOT EXISTS idx_post_comments_post_root ON post_comments(post_id, parent_id) WHERE parent_id IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN post_comments.parent_id IS 'ID do comentário pai para respostas. NULL = comentário raiz';
