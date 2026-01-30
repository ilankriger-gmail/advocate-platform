-- Migration: Admin Resgates Pro
-- Adiciona campos para gerenciamento avançado de resgates

-- 1. Campo de notas admin no claim
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS admin_notes TEXT;
COMMENT ON COLUMN public.reward_claims.admin_notes IS 'Notas internas do admin sobre o resgate';

-- 2. Campo de código de rastreio
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS tracking_code TEXT;
COMMENT ON COLUMN public.reward_claims.tracking_code IS 'Código de rastreio dos Correios ou transportadora';

-- 3. Campo de data de processamento (quando admin atualizou status)
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
COMMENT ON COLUMN public.reward_claims.processed_at IS 'Data em que o admin processou (aprovou/rejeitou) o resgate';

-- 4. Campo de admin que processou
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS processed_by UUID REFERENCES auth.users(id);
COMMENT ON COLUMN public.reward_claims.processed_by IS 'Admin que processou o resgate';

-- 5. Índice para buscas por status
CREATE INDEX IF NOT EXISTS idx_reward_claims_status ON public.reward_claims(status);

-- 6. Índice para buscas por data
CREATE INDEX IF NOT EXISTS idx_reward_claims_created_at ON public.reward_claims(created_at DESC);
