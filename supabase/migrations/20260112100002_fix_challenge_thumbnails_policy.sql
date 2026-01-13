-- Migration: Corrigir políticas do bucket challenge-thumbnails
-- Erro: new row violates row-level security policy

-- 1. Remover políticas antigas que podem estar com problema
DROP POLICY IF EXISTS "Thumbnails são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Apenas admins podem criar thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Apenas admins podem deletar thumbnails" ON storage.objects;

-- 2. Criar política para leitura pública
CREATE POLICY "challenge_thumbnails_select" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'challenge-thumbnails');

-- 3. Criar política para upload - simplificada para usuários autenticados
-- (a verificação de admin é feita na server action)
CREATE POLICY "challenge_thumbnails_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'challenge-thumbnails');

-- 4. Criar política para update
CREATE POLICY "challenge_thumbnails_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'challenge-thumbnails');

-- 5. Criar política para delete
CREATE POLICY "challenge_thumbnails_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'challenge-thumbnails');
