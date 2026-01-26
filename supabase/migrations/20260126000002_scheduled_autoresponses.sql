-- Migration: Tabela para respostas automáticas agendadas
-- O Moço do Te Amo responde comentários com delay de 3min a 2h

CREATE TABLE IF NOT EXISTS public.scheduled_autoresponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT unique_comment_response UNIQUE (comment_id)
);

-- Índice para buscar respostas pendentes
CREATE INDEX IF NOT EXISTS idx_autoresponses_pending 
  ON public.scheduled_autoresponses(status, scheduled_for) 
  WHERE status = 'pending';

-- RLS: Apenas service role pode manipular
ALTER TABLE public.scheduled_autoresponses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.scheduled_autoresponses
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Comentário
COMMENT ON TABLE public.scheduled_autoresponses IS 'Fila de respostas automáticas do Moço do Te Amo com delay de 3min a 2h';
