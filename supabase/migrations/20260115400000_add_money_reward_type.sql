-- Adicionar tipo 'money' para prêmios em dinheiro

-- Remover constraint antiga
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_type_check;

-- Adicionar nova constraint com os 3 tipos
ALTER TABLE public.rewards ADD CONSTRAINT rewards_type_check
  CHECK (type IN ('digital', 'physical', 'money'));
