-- Migration: Adicionar tabela de prêmios para desafios
-- Permite múltiplos tipos de prêmios: físico, digital, dinheiro

-- Criar tabela de prêmios
CREATE TABLE IF NOT EXISTS challenge_prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('physical', 'digital', 'money')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por desafio
CREATE INDEX IF NOT EXISTS idx_challenge_prizes_challenge_id ON challenge_prizes(challenge_id);

-- RLS Policies
ALTER TABLE challenge_prizes ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver prêmios de desafios
CREATE POLICY "Prêmios visíveis para todos"
  ON challenge_prizes
  FOR SELECT
  USING (true);

-- Apenas admins/creators podem gerenciar prêmios
CREATE POLICY "Admins podem gerenciar prêmios"
  ON challenge_prizes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- Migrar prêmios em dinheiro existentes (se houver)
INSERT INTO challenge_prizes (challenge_id, type, name, value, quantity)
SELECT id, 'money', 'Prêmio em Dinheiro', prize_amount, COALESCE(num_winners, 1)
FROM challenges
WHERE prize_amount IS NOT NULL AND prize_amount > 0
ON CONFLICT DO NOTHING;
