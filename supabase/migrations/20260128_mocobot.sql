-- Tabela para ações agendadas do Moço Bot
CREATE TABLE IF NOT EXISTS scheduled_bot_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  post_id UUID NOT NULL,
  comment_id UUID,
  response_text TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca eficiente de ações pendentes
CREATE INDEX IF NOT EXISTS idx_bot_actions_pending 
  ON scheduled_bot_actions(scheduled_for) 
  WHERE status = 'pending';
