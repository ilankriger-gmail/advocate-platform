-- Migration: Criar RPC add_user_coins
-- Fix: Sistema de corações não funcionava porque a RPC não existia

-- ============================================
-- GARANTIR QUE TABELAS EXISTEM
-- ============================================

-- Tabela user_coins (saldo de corações)
CREATE TABLE IF NOT EXISTS user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela coin_transactions (histórico de transações)
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'refund')),
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_coins_user ON user_coins(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created ON coin_transactions(created_at DESC);

-- ============================================
-- RPC: Adicionar corações ao usuário
-- ============================================
CREATE OR REPLACE FUNCTION add_user_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'earned',
  p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Inserir ou atualizar saldo
  INSERT INTO user_coins (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    balance = user_coins.balance + p_amount,
    updated_at = NOW();

  -- Registrar transação
  INSERT INTO coin_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, p_type, p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões
GRANT EXECUTE ON FUNCTION add_user_coins TO authenticated;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

-- user_coins: usuário vê apenas seu próprio saldo
ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coins" ON user_coins;
CREATE POLICY "Users can view own coins" ON user_coins
  FOR SELECT USING (auth.uid() = user_id);

-- coin_transactions: usuário vê apenas suas próprias transações
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
CREATE POLICY "Users can view own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);
