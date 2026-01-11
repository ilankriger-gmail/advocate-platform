-- Migration: Otimizar RLS Policy da tabela profiles
-- Problema: auth.uid() sendo re-avaliado para cada linha
-- Solução: Usar (select auth.uid()) para avaliar uma única vez

-- ============================================
-- Recriar policy com subquery otimizada
-- ============================================
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON public.profiles
FOR UPDATE
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- ============================================
-- Comentário
-- ============================================
COMMENT ON POLICY "Usuários podem atualizar seu próprio perfil" ON public.profiles
IS 'Permite usuários atualizarem apenas seu próprio perfil - otimizado com subquery';
