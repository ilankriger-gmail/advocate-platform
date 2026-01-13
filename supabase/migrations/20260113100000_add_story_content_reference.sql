-- Adicionar campos para vincular conteúdo da plataforma aos stories
ALTER TABLE stories ADD COLUMN IF NOT EXISTS linked_content_type TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS linked_content_id UUID;

-- Constraint para tipos válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_linked_content_type_check'
  ) THEN
    ALTER TABLE stories ADD CONSTRAINT stories_linked_content_type_check
      CHECK (linked_content_type IS NULL OR linked_content_type IN ('challenge', 'reward', 'ranking'));
  END IF;
END $$;

-- Índice para buscar stories por conteúdo vinculado
CREATE INDEX IF NOT EXISTS idx_stories_linked_content
  ON stories(linked_content_type, linked_content_id)
  WHERE linked_content_type IS NOT NULL;

COMMENT ON COLUMN stories.linked_content_type IS 'Tipo de conteúdo vinculado: challenge, reward, ou ranking';
COMMENT ON COLUMN stories.linked_content_id IS 'ID do conteúdo vinculado (desafio ou prêmio)';
