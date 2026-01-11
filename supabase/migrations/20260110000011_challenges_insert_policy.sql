-- Migration: Adicionar policy de INSERT para challenges
-- Permite que creators criem novos desafios

CREATE POLICY "Creator can insert challenges" ON public.challenges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );
