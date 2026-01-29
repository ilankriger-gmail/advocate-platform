-- Migration: Atomic coin deduction with breakdown
-- Fixes race condition where concurrent balance reads/writes cause hearts to disappear

CREATE OR REPLACE FUNCTION deduct_user_coins(
  p_user_id UUID,
  p_total INTEGER,
  p_challenge_amount INTEGER DEFAULT 0,
  p_engagement_amount INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_coins
  SET
    balance = balance - p_total,
    challenge_balance = challenge_balance - p_challenge_amount,
    engagement_balance = engagement_balance - p_engagement_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION deduct_user_coins TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_user_coins TO service_role;
