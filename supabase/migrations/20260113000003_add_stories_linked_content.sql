-- Migration: Adicionar campos de conteúdo vinculado aos Stories
-- Permite vincular stories a desafios, eventos e prêmios

-- Adicionar colunas de conteúdo vinculado
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS linked_content_type TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS linked_content_id UUID;

-- Constraint para tipos válidos de conteúdo vinculado
ALTER TABLE public.stories ADD CONSTRAINT stories_linked_content_type_check
  CHECK (
    linked_content_type IS NULL OR
    linked_content_type IN ('challenge', 'event', 'reward')
  );

-- Atualizar constraint de mídia para incluir conteúdo vinculado como opção
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_check;
ALTER TABLE public.stories ADD CONSTRAINT stories_media_check
  CHECK (
    (media_url IS NOT NULL AND array_length(media_url, 1) > 0) OR
    (youtube_url IS NOT NULL AND youtube_url != '') OR
    (instagram_url IS NOT NULL AND instagram_url != '') OR
    (linked_content_type IS NOT NULL AND linked_content_id IS NOT NULL)
  );

-- Comentários nas colunas
COMMENT ON COLUMN public.stories.linked_content_type IS 'Tipo de conteúdo vinculado: challenge, event, reward';
COMMENT ON COLUMN public.stories.linked_content_id IS 'ID do conteúdo vinculado (desafio, evento ou prêmio)';
