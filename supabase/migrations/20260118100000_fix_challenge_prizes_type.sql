-- Migration: Corrigir CHECK constraint de challenge_prizes para incluir 'coins'
-- O tipo 'coins' é usado para prêmios em corações/moedas da plataforma

-- Remover constraint antigo
ALTER TABLE challenge_prizes DROP CONSTRAINT IF EXISTS challenge_prizes_type_check;

-- Adicionar constraint com 'coins' incluído
ALTER TABLE challenge_prizes ADD CONSTRAINT challenge_prizes_type_check
  CHECK (type IN ('physical', 'digital', 'money', 'coins'));
