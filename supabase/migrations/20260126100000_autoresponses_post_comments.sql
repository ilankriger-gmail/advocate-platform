-- Migration: Permitir comentários automáticos em posts (não apenas respostas a comentários)
-- Agora o Moço pode:
-- 1. Comentar em posts (comment_id = NULL)
-- 2. Responder comentários (comment_id = id do comentário)

-- Remover constraint NOT NULL do comment_id
ALTER TABLE public.scheduled_autoresponses 
  ALTER COLUMN comment_id DROP NOT NULL;

-- Remover constraint de foreign key antiga e recriar com ON DELETE SET NULL
ALTER TABLE public.scheduled_autoresponses 
  DROP CONSTRAINT IF EXISTS scheduled_autoresponses_comment_id_fkey;

ALTER TABLE public.scheduled_autoresponses
  ADD CONSTRAINT scheduled_autoresponses_comment_id_fkey 
  FOREIGN KEY (comment_id) REFERENCES public.post_comments(id) ON DELETE SET NULL;

-- Adicionar coluna para diferenciar tipo de resposta
ALTER TABLE public.scheduled_autoresponses
  ADD COLUMN IF NOT EXISTS response_type TEXT DEFAULT 'comment_reply' 
  CHECK (response_type IN ('comment_reply', 'post_comment'));

-- Remover constraint unique antiga (permitir múltiplos comentários em posts diferentes)
ALTER TABLE public.scheduled_autoresponses
  DROP CONSTRAINT IF EXISTS unique_comment_response;

-- Nova constraint: um comentário só pode ter uma resposta pendente
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_comment_response 
  ON public.scheduled_autoresponses(comment_id) 
  WHERE status = 'pending' AND comment_id IS NOT NULL;

-- Índice para buscar por post (para evitar comentar no mesmo post duas vezes)
CREATE INDEX IF NOT EXISTS idx_autoresponses_post_pending 
  ON public.scheduled_autoresponses(post_id, status) 
  WHERE status = 'pending';

-- Comentário atualizado
COMMENT ON TABLE public.scheduled_autoresponses IS 'Fila de comentários/respostas automáticas do Moço do Te Amo. comment_id NULL = comentário no post; comment_id preenchido = resposta a comentário.';
