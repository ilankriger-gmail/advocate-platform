-- Migration: Adicionar tipo 'participe' aos desafios
-- O formulário permite criar desafios do tipo 'participe' (sorteios/prêmios)
-- mas a constraint atual só permite 'engajamento' e 'fisico'

-- Remover constraint antiga
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_type_check;

-- Adicionar nova constraint com os 3 tipos
ALTER TABLE public.challenges ADD CONSTRAINT challenges_type_check
  CHECK (type IN ('engajamento', 'fisico', 'participe'));
