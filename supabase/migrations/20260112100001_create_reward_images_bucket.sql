-- Migration: Criar bucket reward-images para armazenar imagens de prêmios
-- Necessário para upload de imagens e geração por AI

-- 1. Criar bucket reward-images se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reward-images', 'reward-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Política para upload (usuários autenticados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reward_images_insert' AND tablename = 'objects'
  ) THEN
    CREATE POLICY reward_images_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'reward-images');
  END IF;
END $$;

-- 3. Política para leitura pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reward_images_select' AND tablename = 'objects'
  ) THEN
    CREATE POLICY reward_images_select ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'reward-images');
  END IF;
END $$;

-- 4. Política para update (usuários autenticados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reward_images_update' AND tablename = 'objects'
  ) THEN
    CREATE POLICY reward_images_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'reward-images');
  END IF;
END $$;

-- 5. Política para delete (usuários autenticados)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reward_images_delete' AND tablename = 'objects'
  ) THEN
    CREATE POLICY reward_images_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'reward-images');
  END IF;
END $$;
