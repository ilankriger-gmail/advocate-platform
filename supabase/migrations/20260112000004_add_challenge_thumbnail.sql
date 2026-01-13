-- Adicionar coluna para armazenar URL da thumbnail gerada por IA
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Criar bucket para armazenar thumbnails de desafios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenge-thumbnails',
  'challenge-thumbnails',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ver thumbnails (públicas)
CREATE POLICY "Thumbnails são públicas" ON storage.objects
FOR SELECT USING (bucket_id = 'challenge-thumbnails');

-- Política: apenas service_role ou admins podem fazer upload
CREATE POLICY "Apenas admins podem criar thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'challenge-thumbnails'
  AND (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'creator')
    )
  )
);

-- Política: apenas service_role ou admins podem deletar
CREATE POLICY "Apenas admins podem deletar thumbnails" ON storage.objects
FOR DELETE USING (
  bucket_id = 'challenge-thumbnails'
  AND (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'creator')
    )
  )
);

COMMENT ON COLUMN challenges.thumbnail_url IS 'URL da thumbnail gerada automaticamente por IA (DALL-E)';
