-- Migration: Correcoes de Seguranca
-- Data: 2026-01-10
-- Descricao: Corrige vulnerabilidades de RLS identificadas na auditoria

-- ============================================
-- 1. Corrigir RLS permissiva em post_shares
-- ============================================

-- Remover policies antigas permissivas
DROP POLICY IF EXISTS "Anyone can create shares" ON post_shares;
DROP POLICY IF EXISTS "Anyone can view shares" ON post_shares;

-- Criar policies seguras (apenas usuarios autenticados)
CREATE POLICY "Authenticated users can create shares"
ON post_shares
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can view shares"
ON post_shares
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 2. Adicionar policy de moderacao em posts
-- ============================================

-- Policy para UPDATE de posts (apenas admin/creator ou proprio usuario)
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Admins can moderate posts" ON posts;

-- Usuarios podem atualizar seus proprios posts
CREATE POLICY "Users can update own posts"
ON posts
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Admins/Creators podem moderar qualquer post
CREATE POLICY "Admins can moderate posts"
ON posts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (select auth.uid())
    AND (role = 'admin' OR is_creator = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = (select auth.uid())
    AND (role = 'admin' OR is_creator = true)
  )
);

-- ============================================
-- 3. Otimizar outras policies com subquery
-- ============================================

-- post_votes
DROP POLICY IF EXISTS "Users can vote" ON post_votes;
CREATE POLICY "Users can vote"
ON post_votes
FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can change vote" ON post_votes;
CREATE POLICY "Users can change vote"
ON post_votes
FOR UPDATE
TO authenticated
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can remove vote" ON post_votes;
CREATE POLICY "Users can remove vote"
ON post_votes
FOR DELETE
TO authenticated
USING ((select auth.uid()) = user_id);

-- ============================================
-- Comentarios
-- ============================================
COMMENT ON POLICY "Authenticated users can create shares" ON post_shares
IS 'Apenas usuarios autenticados podem compartilhar posts';

COMMENT ON POLICY "Users can update own posts" ON posts
IS 'Usuarios podem editar apenas seus proprios posts';

COMMENT ON POLICY "Admins can moderate posts" ON posts
IS 'Admins e criadores podem moderar qualquer post';
