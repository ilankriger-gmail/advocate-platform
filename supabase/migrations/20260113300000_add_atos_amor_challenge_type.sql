-- Migration: Adicionar tipo 'atos_amor' aos desafios
-- Atos de Amor: desafios onde o usuario faz uma boa acao,
-- posta no Instagram com hashtag e envia video no YouTube para validacao automatica via Gemini

-- Remover constraint antiga
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_type_check;

-- Adicionar nova constraint com os 4 tipos
ALTER TABLE public.challenges ADD CONSTRAINT challenges_type_check
  CHECK (type IN ('engajamento', 'fisico', 'participe', 'atos_amor'));

-- Adicionar campo para indicar se o desafio requer validacao de video
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS requires_video_validation BOOLEAN DEFAULT FALSE;

-- Adicionar campo para instrucoes especificas do ato de amor
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS action_instructions TEXT;

-- Comentarios para documentacao
COMMENT ON COLUMN public.challenges.requires_video_validation IS 'Se true, o desafio requer envio de video YouTube para validacao automatica via IA';
COMMENT ON COLUMN public.challenges.action_instructions IS 'Instrucoes especificas para realizar o ato de amor (ex: ajudar alguem, doar algo, etc)';
