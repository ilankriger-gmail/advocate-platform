-- Migration: Sistema de Indicação com Recompensas em Cascata
-- Quem indica: 100 corações | Indicado: 100 corações
-- Gerações: 50 → 25 → 12 → 6 → 3

-- Tabela de indicações
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referrer_reward_paid BOOLEAN DEFAULT false,
  referred_reward_paid BOOLEAN DEFAULT false,
  cascade_rewards_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT unique_referred UNIQUE (referred_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Adicionar código de indicação aos usuários
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id);

-- Gerar código único para usuários existentes
UPDATE public.users 
SET referral_code = UPPER(SUBSTRING(MD5(id::text || NOW()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Função para gerar código de indicação
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS trigger_generate_referral_code ON public.users;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Função para calcular recompensa por geração
-- Geração 1 (indicação direta): 100
-- Geração 2: 50
-- Geração 3: 25
-- Geração 4: 12
-- Geração 5: 6
-- Geração 6: 3
CREATE OR REPLACE FUNCTION get_referral_reward(generation INT)
RETURNS INT AS $$
BEGIN
  CASE generation
    WHEN 1 THEN RETURN 100;
    WHEN 2 THEN RETURN 50;
    WHEN 3 THEN RETURN 25;
    WHEN 4 THEN RETURN 12;
    WHEN 5 THEN RETURN 6;
    WHEN 6 THEN RETURN 3;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função recursiva para pagar recompensas em cascata
CREATE OR REPLACE FUNCTION pay_referral_cascade(
  new_user_id UUID,
  max_generations INT DEFAULT 6
)
RETURNS TABLE(user_id UUID, generation INT, reward INT) AS $$
DECLARE
  current_user UUID := new_user_id;
  current_generation INT := 1;
  referrer UUID;
  reward_amount INT;
BEGIN
  -- Encontrar quem indicou o novo usuário
  SELECT referred_by INTO referrer FROM public.users WHERE id = current_user;
  
  WHILE referrer IS NOT NULL AND current_generation <= max_generations LOOP
    reward_amount := get_referral_reward(current_generation);
    
    IF reward_amount > 0 THEN
      -- Retornar linha com info da recompensa
      user_id := referrer;
      generation := current_generation;
      reward := reward_amount;
      RETURN NEXT;
    END IF;
    
    -- Subir para a próxima geração
    current_user := referrer;
    SELECT referred_by INTO referrer FROM public.users WHERE id = current_user;
    current_generation := current_generation + 1;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Tabela para log de recompensas de indicação
CREATE TABLE IF NOT EXISTS public.referral_rewards_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  new_user_id UUID NOT NULL REFERENCES public.users(id),
  generation INT NOT NULL,
  reward_amount INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user ON public.referral_rewards_log(user_id);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards_log ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias indicações
CREATE POLICY "Users can view own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Service role full access
CREATE POLICY "Service role full access referrals"
  ON public.referrals
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access rewards log"
  ON public.referral_rewards_log
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comentários
COMMENT ON TABLE public.referrals IS 'Sistema de indicação com recompensas em cascata';
COMMENT ON TABLE public.referral_rewards_log IS 'Log de recompensas pagas por indicação';
