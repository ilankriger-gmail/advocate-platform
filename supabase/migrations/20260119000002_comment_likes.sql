-- =====================================================
-- MIGRAÇÃO: Adicionar suporte a curtidas em comentários
-- =====================================================

-- Adicionar contador de likes na tabela de comentários
ALTER TABLE post_comments
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Criar tabela de curtidas em comentários
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Habilitar RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver todas as curtidas de comentários"
  ON comment_likes FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem curtir comentários"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover própria curtida de comentário"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Função para incrementar contador de likes
CREATE OR REPLACE FUNCTION increment_comment_likes(p_comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para decrementar contador de likes
CREATE OR REPLACE FUNCTION decrement_comment_likes(p_comment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE post_comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários explicativos
COMMENT ON TABLE comment_likes IS 'Curtidas em comentários de posts';
COMMENT ON COLUMN post_comments.likes_count IS 'Contador de curtidas do comentário';
