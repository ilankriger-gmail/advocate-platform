-- =============================================
-- MIGRACAO: Desafios Fisicos Completos
-- Execute este SQL no Supabase SQL Editor (uma unica vez)
-- =============================================

-- 1. Adicionar campos de sorteio na tabela challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_enabled BOOLEAN DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_prize_amount DECIMAL(10,2);
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_num_winners INTEGER DEFAULT 1;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS raffle_frequency_days INTEGER DEFAULT 30;

-- 2. Adicionar campos de IA e sorteio na tabela challenge_participants
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS ai_verdict JSONB;
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS is_raffle_eligible BOOLEAN DEFAULT false;
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. Criar tabela de sorteios
CREATE TABLE IF NOT EXISTS challenge_raffles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  winner_user_id UUID REFERENCES profiles(id),
  prize_amount DECIMAL(10,2),
  drawn_at TIMESTAMPTZ DEFAULT now(),
  pix_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS na tabela de sorteios
ALTER TABLE challenge_raffles ENABLE ROW LEVEL SECURITY;

-- 5. Politicas de acesso para challenge_raffles
-- Qualquer um pode ver os ganhadores
DROP POLICY IF EXISTS "challenge_raffles_select" ON challenge_raffles;
CREATE POLICY "challenge_raffles_select" ON challenge_raffles
  FOR SELECT USING (true);

-- Apenas admins podem modificar
DROP POLICY IF EXISTS "challenge_raffles_admin" ON challenge_raffles;
CREATE POLICY "challenge_raffles_admin" ON challenge_raffles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.is_creator = true)
    )
  );

-- 6. Funcao para adicionar moedas (caso ainda nao exista)
CREATE OR REPLACE FUNCTION add_user_coins(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_coins (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = user_coins.balance + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atualizar desafio fisico existente para ter sorteio
-- (exemplo - descomente e ajuste se quiser)
-- UPDATE challenges
-- SET
--   raffle_enabled = true,
--   raffle_prize_amount = 100.00,
--   raffle_num_winners = 1,
--   raffle_frequency_days = 30
-- WHERE type = 'fisico';

-- =============================================
-- FIM DA MIGRACAO
-- =============================================
