-- Migração: Termômetro de Sentimento
-- Substitui upvote/downvote binário por escala de -5 a +5

-- 1. Limpar votos existentes
TRUNCATE TABLE post_votes;

-- 2. Remover constraint antiga e adicionar nova para escala -5 a +5
ALTER TABLE post_votes DROP CONSTRAINT IF EXISTS post_votes_vote_type_check;
ALTER TABLE post_votes ADD CONSTRAINT post_votes_vote_type_check
  CHECK (vote_type >= -5 AND vote_type <= 5 AND vote_type != 0);

-- 3. Adicionar colunas para média e total de votos em posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS vote_average NUMERIC(3,2) DEFAULT 0;

-- 4. Resetar scores existentes
UPDATE posts SET vote_score = 0, vote_count = 0, vote_average = 0;

-- 5. Atualizar função do trigger para calcular soma, contagem e média
CREATE OR REPLACE FUNCTION update_post_vote_score()
RETURNS TRIGGER AS $$
DECLARE
  new_count INTEGER;
  new_sum INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Adiciona novo voto
    UPDATE posts
    SET
      vote_score = vote_score + NEW.vote_type,
      vote_count = vote_count + 1
    WHERE id = NEW.post_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Remove voto
    UPDATE posts
    SET
      vote_score = vote_score - OLD.vote_type,
      vote_count = GREATEST(vote_count - 1, 0)
    WHERE id = OLD.post_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualiza voto (muda de valor)
    UPDATE posts
    SET vote_score = vote_score - OLD.vote_type + NEW.vote_type
    WHERE id = NEW.post_id;
  END IF;

  -- Recalcula média após qualquer operação
  IF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET vote_average = CASE
      WHEN vote_count > 0 THEN ROUND(vote_score::NUMERIC / vote_count, 2)
      ELSE 0
    END
    WHERE id = OLD.post_id;
  ELSE
    UPDATE posts
    SET vote_average = CASE
      WHEN vote_count > 0 THEN ROUND(vote_score::NUMERIC / vote_count, 2)
      ELSE 0
    END
    WHERE id = NEW.post_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Recriar trigger
DROP TRIGGER IF EXISTS post_vote_trigger ON post_votes;
CREATE TRIGGER post_vote_trigger
AFTER INSERT OR UPDATE OR DELETE ON post_votes
FOR EACH ROW EXECUTE FUNCTION update_post_vote_score();

-- 7. Índice para performance de ordenação por média
CREATE INDEX IF NOT EXISTS idx_posts_vote_average ON posts(vote_average DESC);
CREATE INDEX IF NOT EXISTS idx_posts_vote_count ON posts(vote_count DESC);
