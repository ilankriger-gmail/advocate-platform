-- Feed V2 Improvements Migration
-- Data: 2026-01-08

-- =====================================================
-- 1. ÍNDICES PARA PERFORMANCE DO FEED
-- =====================================================

-- Índice para ordenação cronológica (mais usado)
CREATE INDEX IF NOT EXISTS idx_posts_approved_created
ON posts(created_at DESC)
WHERE status = 'approved';

-- Índice para ordenação por votos (Top)
CREATE INDEX IF NOT EXISTS idx_posts_approved_votes
ON posts(vote_score DESC)
WHERE status = 'approved';

-- Índice composto para filtro por tipo + status + data
CREATE INDEX IF NOT EXISTS idx_posts_type_approved_created
ON posts(type, created_at DESC)
WHERE status = 'approved';

-- Índices para tabela de votos
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_composite ON post_votes(post_id, user_id);

-- Índices para tabela de comentários
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(post_id, created_at DESC);

-- =====================================================
-- 2. TABELA DE SAVES/BOOKMARKS
-- =====================================================

CREATE TABLE IF NOT EXISTS post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Índices para saves
CREATE INDEX IF NOT EXISTS idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_post_id ON post_saves(post_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user_created ON post_saves(user_id, created_at DESC);

-- RLS para saves
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver seus próprios saves
CREATE POLICY "Users can view own saves" ON post_saves
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem criar saves para si mesmos
CREATE POLICY "Users can create own saves" ON post_saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios saves
CREATE POLICY "Users can delete own saves" ON post_saves
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 3. COLUNA saves_count NA TABELA POSTS (opcional)
-- =====================================================

-- Adicionar contador de saves nos posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

-- Função para atualizar contador de saves
CREATE OR REPLACE FUNCTION update_post_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET saves_count = saves_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_saves_count ON post_saves;
CREATE TRIGGER trigger_update_saves_count
AFTER INSERT OR DELETE ON post_saves
FOR EACH ROW EXECUTE FUNCTION update_post_saves_count();

-- =====================================================
-- 4. TABELA DE SHARES (ANALYTICS)
-- =====================================================

CREATE TABLE IF NOT EXISTS post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  platform VARCHAR(50) NOT NULL DEFAULT 'copy_link', -- 'copy_link', 'native', 'twitter', etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para analytics de shares
CREATE INDEX IF NOT EXISTS idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_post_shares_created ON post_shares(created_at DESC);

-- RLS para shares (qualquer usuário logado pode criar)
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create shares" ON post_shares
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view shares" ON post_shares
  FOR SELECT USING (true);

-- Adicionar contador de shares nos posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Função para atualizar contador de shares
CREATE OR REPLACE FUNCTION update_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar contador automaticamente
DROP TRIGGER IF EXISTS trigger_update_shares_count ON post_shares;
CREATE TRIGGER trigger_update_shares_count
AFTER INSERT ON post_shares
FOR EACH ROW EXECUTE FUNCTION update_post_shares_count();

-- =====================================================
-- 5. HABILITAR REALTIME PARA POSTS
-- =====================================================

-- Habilitar publicação de mudanças em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
