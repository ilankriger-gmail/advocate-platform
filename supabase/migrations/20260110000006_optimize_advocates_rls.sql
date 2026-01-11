-- Migration: Otimizar RLS Policy da tabela advocates
-- Problema: auth.uid() sendo re-avaliado para cada linha
-- Solução: Usar (select auth.uid()) para avaliar uma única vez

-- ============================================
-- Recriar policy com subquery otimizada
-- ============================================
DROP POLICY IF EXISTS "Novos usuários podem criar perfil de advocate" ON public.advocates;

CREATE POLICY "Novos usuários podem criar perfil de advocate"
ON public.advocates
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- ============================================
-- Comentário
-- ============================================
COMMENT ON POLICY "Novos usuários podem criar perfil de advocate" ON public.advocates
IS 'Permite novos usuários criarem seu perfil de advocate - otimizado com subquery';
