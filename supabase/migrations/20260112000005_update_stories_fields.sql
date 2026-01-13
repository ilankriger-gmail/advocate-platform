-- Migration: Adicionar campos completos aos Stories
-- Permite título, conteúdo rich text, YouTube e Instagram embeds

-- Adicionar novas colunas
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Remover constraint antiga de media_type (se existir)
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_type_check;

-- Adicionar nova constraint de media_type incluindo youtube e instagram
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stories_media_type_check'
  ) THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check
      CHECK (media_type IN ('image', 'carousel', 'youtube', 'instagram'));
  END IF;
END $$;

-- Remover constraint antiga de media obrigatória
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_media_not_empty;

-- Adicionar nova constraint - mídia OU youtube OU instagram deve estar presente
ALTER TABLE public.stories ADD CONSTRAINT stories_media_check
  CHECK (
    (media_url IS NOT NULL AND array_length(media_url, 1) > 0) OR
    (youtube_url IS NOT NULL AND youtube_url != '') OR
    (instagram_url IS NOT NULL AND instagram_url != '')
  );

-- Comentários nas colunas
COMMENT ON COLUMN public.stories.title IS 'Título opcional do story';
COMMENT ON COLUMN public.stories.content IS 'Conteúdo rich text do story (HTML sanitizado)';
COMMENT ON COLUMN public.stories.youtube_url IS 'URL do vídeo do YouTube (apenas criadores)';
COMMENT ON COLUMN public.stories.instagram_url IS 'URL do post/reel do Instagram (apenas criadores)';
