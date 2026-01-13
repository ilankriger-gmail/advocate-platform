-- ============================================
-- Sistema de Followers/Following
-- ============================================

-- Tabela de relacionamentos de seguir
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: um usuário só pode seguir outro uma vez
  UNIQUE(follower_id, following_id),

  -- Constraint: não pode seguir a si mesmo
  CHECK (follower_id != following_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_created ON user_follows(created_at DESC);

-- Adicionar colunas de contadores na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ============================================
-- Função para atualizar contadores de follow
-- ============================================
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar followers_count do usuário seguido
    UPDATE users
    SET followers_count = COALESCE(followers_count, 0) + 1
    WHERE id = NEW.following_id;

    -- Incrementar following_count do seguidor
    UPDATE users
    SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar followers_count do usuário seguido
    UPDATE users
    SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0)
    WHERE id = OLD.following_id;

    -- Decrementar following_count do seguidor
    UPDATE users
    SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para manter contadores sincronizados
DROP TRIGGER IF EXISTS user_follow_counts_trigger ON user_follows;
CREATE TRIGGER user_follow_counts_trigger
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver quem segue quem
CREATE POLICY "Anyone can view follows"
  ON user_follows FOR SELECT
  USING (true);

-- Usuários autenticados podem seguir outros
CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Usuários só podem deixar de seguir (deletar) seus próprios follows
CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ============================================
-- Função para verificar se está seguindo
-- ============================================
CREATE OR REPLACE FUNCTION is_following(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = auth.uid()
    AND following_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Habilitar Realtime para user_follows
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE user_follows;

-- ============================================
-- Comentários
-- ============================================
COMMENT ON TABLE user_follows IS 'Tabela de relacionamentos de seguir entre usuários';
COMMENT ON COLUMN user_follows.follower_id IS 'ID do usuário que está seguindo';
COMMENT ON COLUMN user_follows.following_id IS 'ID do usuário que está sendo seguido';
