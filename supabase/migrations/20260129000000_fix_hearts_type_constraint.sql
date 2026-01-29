-- Migration: Fix hearts not being awarded on likes/comments
-- Bug: add_user_coins was receiving action names (post_like, comment, etc.) as p_type,
-- but coin_transactions.type has CHECK constraint allowing only 'earned','spent','bonus','refund'.
-- This caused the INSERT to fail, rolling back the entire balance update.
-- Fix: Add reference_type column, store action type there, always use 'earned' for type.

-- Step 1: Add missing reference_type column
ALTER TABLE coin_transactions ADD COLUMN IF NOT EXISTS reference_type TEXT;

-- Step 2: Drop and re-add CHECK constraint (ensure it's clean)
ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_check;

ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_check
  CHECK (type IN ('earned', 'spent', 'bonus', 'refund'));

-- Step 3: Recreate the RPC to properly separate type vs reference_type
CREATE OR REPLACE FUNCTION add_user_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'earned',
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Inserir ou atualizar saldo
  INSERT INTO user_coins (user_id, balance, updated_at, total_earned)
  VALUES (p_user_id, p_amount, NOW(), p_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_coins.balance + p_amount,
    total_earned = user_coins.total_earned + p_amount,
    updated_at = NOW();

  -- Registrar transação
  -- p_type from the app is actually the reference_type (e.g. 'post_like', 'comment')
  -- The actual transaction type is always 'earned' for hearts
  INSERT INTO coin_transactions (user_id, amount, type, description, reference_type)
  VALUES (p_user_id, p_amount, 'earned', p_description, p_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
