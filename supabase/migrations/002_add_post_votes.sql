-- Migração: Sistema de Votos (Upvote/Downvote)
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de votos
CREATE TABLE IF NOT EXISTS post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL CHECK (vote_type IN (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 2. Adicionar coluna vote_score em posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS vote_score INTEGER DEFAULT 0;

-- 3. Criar função para atualizar vote_score automaticamente
CREATE OR REPLACE FUNCTION update_post_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET vote_score = vote_score + NEW.vote_type WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET vote_score = vote_score - OLD.vote_type WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE posts SET vote_score = vote_score - OLD.vote_type + NEW.vote_type WHERE id = NEW.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger para votos
DROP TRIGGER IF EXISTS post_vote_trigger ON post_votes;
CREATE TRIGGER post_vote_trigger
AFTER INSERT OR UPDATE OR DELETE ON post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_vote_score();

-- 5. Habilitar RLS para post_votes
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acesso
CREATE POLICY "Users can insert own votes" ON post_votes
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON post_votes
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON post_votes
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view votes" ON post_votes
FOR SELECT TO public
USING (true);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_post_votes_post_id ON post_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_votes_user_id ON post_votes(user_id);
