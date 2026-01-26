-- Histórico de posições do ranking
-- Usado para mostrar se o usuário subiu ou desceu

CREATE TABLE IF NOT EXISTS ranking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Só um registro por usuário por dia
  UNIQUE(user_id, recorded_at)
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_ranking_history_user_date 
  ON ranking_history(user_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_ranking_history_date 
  ON ranking_history(recorded_at DESC);

-- RLS
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ranking history" ON ranking_history
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert ranking history" ON ranking_history
  FOR INSERT WITH CHECK (true);

-- Função para atualizar o snapshot do ranking
CREATE OR REPLACE FUNCTION update_ranking_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  pos INTEGER := 0;
BEGIN
  -- Deletar snapshot de hoje se existir (para atualizar)
  DELETE FROM ranking_history WHERE recorded_at = CURRENT_DATE;
  
  -- Inserir novo snapshot
  FOR r IN 
    SELECT user_id, balance 
    FROM user_coins 
    WHERE balance > 0
    ORDER BY balance DESC
  LOOP
    pos := pos + 1;
    INSERT INTO ranking_history (user_id, position, balance, recorded_at)
    VALUES (r.user_id, pos, r.balance, CURRENT_DATE);
  END LOOP;
END;
$$;

-- Rodar agora para criar o primeiro snapshot
SELECT update_ranking_snapshot();

COMMENT ON TABLE ranking_history IS 'Snapshot diário das posições do ranking para mostrar movimento';
