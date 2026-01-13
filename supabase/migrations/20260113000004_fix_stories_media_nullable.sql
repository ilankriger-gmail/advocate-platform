-- Migration: Permitir media_url nulo para stories de YouTube/Instagram
-- O campo media_url não é mais obrigatório quando há youtube_url ou instagram_url

-- Remover constraint NOT NULL de media_url
ALTER TABLE public.stories ALTER COLUMN media_url DROP NOT NULL;

-- Garantir que a constraint de verificação está correta
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_not_empty;
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_check;

-- Nova constraint: deve ter mídia OU youtube OU instagram OU conteúdo vinculado
ALTER TABLE public.stories ADD CONSTRAINT stories_media_check
  CHECK (
    (media_url IS NOT NULL AND array_length(media_url, 1) > 0) OR
    (youtube_url IS NOT NULL AND youtube_url != '') OR
    (instagram_url IS NOT NULL AND instagram_url != '') OR
    (linked_content_type IS NOT NULL AND linked_content_id IS NOT NULL)
  );
