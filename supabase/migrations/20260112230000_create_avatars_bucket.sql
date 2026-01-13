-- Criar bucket para avatars de usuários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir upload pelo próprio usuário
-- O arquivo é salvo como: {user_id}-{timestamp}.{ext}
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '-%'
);

-- Política para permitir update pelo próprio usuário
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '-%'
);

-- Política para permitir delete pelo próprio usuário
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  name LIKE auth.uid()::text || '-%'
);

-- Política para leitura pública (bucket é público)
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');
