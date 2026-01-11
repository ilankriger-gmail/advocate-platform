-- Migration: Adicionar policies para UPDATE em challenges e rewards
-- Permite que creators/admins possam ativar/desativar desafios e premios

-- Policy para UPDATE em challenges
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

-- Policy para UPDATE em rewards
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
