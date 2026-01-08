-- Migração: Adicionar campos de mídia na tabela posts
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo para tipo de mídia
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'none';
-- Valores possíveis: 'none', 'image', 'carousel', 'youtube', 'instagram'

-- Adicionar campo para URL do YouTube (apenas criadores)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Adicionar campo para URL do Instagram (apenas criadores)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Criar bucket para imagens de posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso para o bucket post-images

-- Permitir usuários autenticados fazer upload
CREATE POLICY "Users can upload post images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Permitir qualquer pessoa visualizar as imagens (públicas)
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Permitir usuários deletarem suas próprias imagens
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir usuários atualizarem suas próprias imagens
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
