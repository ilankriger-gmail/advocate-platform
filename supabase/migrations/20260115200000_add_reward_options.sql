-- Migration: Adicionar campo available_options para cores e tamanhos de prêmios
-- Data: 2026-01-15

-- Adicionar coluna para opções disponíveis (cores, tamanhos)
ALTER TABLE public.rewards
ADD COLUMN IF NOT EXISTS available_options JSONB DEFAULT NULL;

COMMENT ON COLUMN public.rewards.available_options IS 'Opções disponíveis para o prêmio: cores, tamanhos (JSON). Ex: {"colors": ["Branco", "Preto"], "sizes": ["P", "M", "G"]}';

-- Atualizar delivery_address para incluir seleções do usuário
-- O campo já é JSONB então pode armazenar size e color junto com o endereço
