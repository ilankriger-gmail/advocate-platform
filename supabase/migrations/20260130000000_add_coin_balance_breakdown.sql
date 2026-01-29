-- Migration: Rastreamento de origem de moedas (challenge vs engagement)
-- Permite diferenciar moedas ganhas por desafios vs engajamento
-- Regra de negócio: ao rejeitar resgate, moedas de desafio são canceladas, engajamento é devolvido

-- ============================================================
-- 1. Adicionar colunas de breakdown na tabela user_coins
-- ============================================================
ALTER TABLE user_coins ADD COLUMN IF NOT EXISTS challenge_balance INTEGER DEFAULT 0;
ALTER TABLE user_coins ADD COLUMN IF NOT EXISTS engagement_balance INTEGER DEFAULT 0;

-- ============================================================
-- 2. Adicionar colunas de breakdown na tabela reward_claims
-- ============================================================
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS challenge_coins_spent INTEGER DEFAULT 0;
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS engagement_coins_spent INTEGER DEFAULT 0;

-- ============================================================
-- 3. Popular valores iniciais baseado no histórico de transações
-- ============================================================
-- Classificação:
--   CHALLENGE = transações com reference_id que aponta para challenge_participants
--               OU description contendo 'Desafio' (case insensitive)
--               OU reference_type = 'challenge_rejected' ou 'challenge_refunded'
--   ENGAGEMENT = todo o resto (posts, curtidas, indicações, bônus, etc.)

-- Calcular challenge_balance: soma de transações ligadas a desafios
WITH challenge_totals AS (
  SELECT
    ct.user_id,
    COALESCE(SUM(ct.amount), 0) AS total
  FROM coin_transactions ct
  WHERE ct.type IN ('earned', 'bonus')
    AND ct.amount > 0
    AND (
      -- Transação referencia uma participação em desafio
      EXISTS (
        SELECT 1 FROM challenge_participants cp
        WHERE cp.id::text = ct.reference_id
      )
      -- OU descrição menciona desafio
      OR ct.description ILIKE '%desafio%conclu%'
      OR ct.description ILIKE '%desafio aprovado%'
      OR ct.reference_type IN ('challenge_approved', 'challenge')
    )
  GROUP BY ct.user_id
),
-- Subtrair moedas de desafio que foram removidas (rejeições com remove)
challenge_removals AS (
  SELECT
    ct.user_id,
    COALESCE(SUM(ABS(ct.amount)), 0) AS total
  FROM coin_transactions ct
  WHERE ct.amount < 0
    AND (
      ct.reference_type = 'challenge_rejected'
      OR ct.description ILIKE '%desafio rejeitado%pontos removidos%'
    )
  GROUP BY ct.user_id
)
UPDATE user_coins uc
SET challenge_balance = GREATEST(0,
  COALESCE((SELECT total FROM challenge_totals WHERE user_id = uc.user_id), 0)
  - COALESCE((SELECT total FROM challenge_removals WHERE user_id = uc.user_id), 0)
)
WHERE EXISTS (SELECT 1 FROM challenge_totals WHERE user_id = uc.user_id)
   OR EXISTS (SELECT 1 FROM challenge_removals WHERE user_id = uc.user_id);

-- Engagement = balance - challenge_balance (tudo que não é desafio)
UPDATE user_coins
SET engagement_balance = GREATEST(0, balance - challenge_balance);

-- ============================================================
-- 4. Atualizar RPC add_user_coins para suportar coin_source
-- ============================================================
CREATE OR REPLACE FUNCTION add_user_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'earned',
  p_description TEXT DEFAULT NULL,
  p_coin_source TEXT DEFAULT 'engagement'  -- 'challenge' ou 'engagement'
)
RETURNS VOID AS $$
BEGIN
  -- Inserir ou atualizar saldo
  INSERT INTO user_coins (user_id, balance, updated_at, total_earned, challenge_balance, engagement_balance)
  VALUES (
    p_user_id,
    p_amount,
    NOW(),
    CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    CASE WHEN p_coin_source = 'challenge' THEN p_amount ELSE 0 END,
    CASE WHEN p_coin_source = 'engagement' THEN p_amount ELSE 0 END
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_coins.balance + p_amount,
    total_earned = user_coins.total_earned + CASE WHEN p_amount > 0 THEN p_amount ELSE 0 END,
    challenge_balance = user_coins.challenge_balance + CASE WHEN p_coin_source = 'challenge' THEN p_amount ELSE 0 END,
    engagement_balance = user_coins.engagement_balance + CASE WHEN p_coin_source = 'engagement' THEN p_amount ELSE 0 END,
    updated_at = NOW();

  -- Registrar transação
  INSERT INTO coin_transactions (user_id, amount, type, description, reference_type)
  VALUES (p_user_id, p_amount, 'earned', p_description, p_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. Comentários
-- ============================================================
COMMENT ON COLUMN user_coins.challenge_balance IS 'Saldo de moedas ganhas por desafios. Não devolvidas em rejeição de resgate.';
COMMENT ON COLUMN user_coins.engagement_balance IS 'Saldo de moedas ganhas por engajamento. Devolvidas em rejeição de resgate.';
COMMENT ON COLUMN reward_claims.challenge_coins_spent IS 'Quantidade de moedas de desafio gastas neste resgate.';
COMMENT ON COLUMN reward_claims.engagement_coins_spent IS 'Quantidade de moedas de engajamento gastas neste resgate.';
