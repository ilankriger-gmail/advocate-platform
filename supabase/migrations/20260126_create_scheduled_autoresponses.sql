-- Tabela para respostas automáticas agendadas do Moço do Te Amo
-- Criada em 26/01/2026

CREATE TABLE IF NOT EXISTS scheduled_autoresponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para buscar respostas pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_autoresponses_pending 
ON scheduled_autoresponses(scheduled_for) 
WHERE status = 'pending';

-- Comentário na tabela
COMMENT ON TABLE scheduled_autoresponses IS 'Respostas automáticas do Moço agendadas para envio futuro';
