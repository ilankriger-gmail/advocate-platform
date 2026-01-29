-- Migration: Fix add_user_coins function overload ambiguity
-- Bug: Two versions of add_user_coins exist (4-param and 5-param).
-- PostgREST cannot disambiguate between them, causing ALL hearts/coins 
-- operations to fail silently with PGRST203 error.
-- Fix: Drop the old 4-param version, keep only the 5-param one (which has defaults).

-- Step 1: Drop the old 4-param version explicitly
DROP FUNCTION IF EXISTS add_user_coins(UUID, INTEGER, TEXT, TEXT);

-- Step 2: Recreate the definitive 5-param version (idempotent)
CREATE OR REPLACE FUNCTION add_user_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'earned',
  p_description TEXT DEFAULT NULL,
  p_coin_source TEXT DEFAULT 'engagement'
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

-- Step 3: Ensure permissions
GRANT EXECUTE ON FUNCTION add_user_coins(UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_coins(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;
