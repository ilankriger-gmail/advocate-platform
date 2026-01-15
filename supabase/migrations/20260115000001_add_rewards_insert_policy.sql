-- Migration: Adicionar política de INSERT para rewards
-- Permite que admin e creator criem novas recompensas

-- Remover política existente se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Admin or Creator can insert rewards" ON public.rewards;

-- Criar política de INSERT para admin e creator
CREATE POLICY "Admin or Creator can insert rewards" ON public.rewards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- Garantir que também podem deletar
DROP POLICY IF EXISTS "Admin or Creator can delete rewards" ON public.rewards;

CREATE POLICY "Admin or Creator can delete rewards" ON public.rewards
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );
