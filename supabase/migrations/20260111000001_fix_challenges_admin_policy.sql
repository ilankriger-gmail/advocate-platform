-- Migration: Corrigir policy de challenges para incluir admin
-- Bug: Admin nao conseguia ver/editar desafios inativos

-- CHALLENGES - SELECT
DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.challenges;

CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  );

-- CHALLENGES - UPDATE
DROP POLICY IF EXISTS "Creator can update challenges" ON public.challenges;

CREATE POLICY "Admin or Creator can update challenges" ON public.challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  );

-- REWARDS - SELECT (mesma correcao)
DROP POLICY IF EXISTS "Anyone can view active rewards" ON public.rewards;

CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  );

-- REWARDS - UPDATE
DROP POLICY IF EXISTS "Creator can update rewards" ON public.rewards;

CREATE POLICY "Admin or Creator can update rewards" ON public.rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role IN ('admin', 'creator') OR users.is_creator = true)
    )
  );
