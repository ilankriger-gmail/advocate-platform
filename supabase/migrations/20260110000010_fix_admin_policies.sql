-- Migration: Corrigir policies de challenges e rewards para admins
-- Remove policies antigas que podem estar conflitando e recria corretamente

-- ======================
-- CHALLENGES
-- ======================

-- Remove policy antiga de SELECT (só mostrava ativos)
DROP POLICY IF EXISTS "Challenges viewable by all" ON public.challenges;

-- Nova policy de SELECT: todos veem ativos, creators veem tudo
CREATE POLICY "Anyone can view active challenges" ON public.challenges
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );

-- Policy de UPDATE já deve existir, mas recria para garantir
DROP POLICY IF EXISTS "Creator can update challenges" ON public.challenges;

CREATE POLICY "Creator can update challenges" ON public.challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );

-- ======================
-- REWARDS
-- ======================

-- Remove policy antiga de SELECT (só mostrava ativos)
DROP POLICY IF EXISTS "Rewards viewable by all" ON public.rewards;

-- Nova policy de SELECT: todos veem ativos, creators veem tudo
CREATE POLICY "Anyone can view active rewards" ON public.rewards
  FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );

-- Policy de UPDATE já deve existir, mas recria para garantir
DROP POLICY IF EXISTS "Creator can update rewards" ON public.rewards;

CREATE POLICY "Creator can update rewards" ON public.rewards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );
