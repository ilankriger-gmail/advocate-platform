-- Migration: Atualizar campos de Rewards
-- Adiciona type, delivery_address para prêmios físicos

-- 1. Adicionar campo type se não existir
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'digital';

-- 2. Adicionar constraint de type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rewards_type_check'
  ) THEN
    ALTER TABLE public.rewards ADD CONSTRAINT rewards_type_check
      CHECK (type IN ('digital', 'physical'));
  END IF;
END $$;

-- 3. Adicionar campo delivery_address em reward_claims (JSONB para flexibilidade)
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS delivery_address JSONB;

-- 4. Comentários nas colunas
COMMENT ON COLUMN public.rewards.type IS 'Tipo do prêmio: digital ou physical';
COMMENT ON COLUMN public.reward_claims.delivery_address IS 'Endereço de entrega para prêmios físicos (JSON com cep, rua, numero, complemento, bairro, cidade, estado)';

-- 5. Criar bucket para imagens de recompensas (se não existir)
-- Nota: Isso deve ser feito via Supabase Dashboard ou CLI, mas documentamos aqui
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reward-images', 'reward-images', true) ON CONFLICT DO NOTHING;
