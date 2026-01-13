-- Migration: Adicionar campos para comprovação do Instagram em desafios
-- Permite que usuários enviem link do Instagram além do YouTube para Atos de Amor

-- Adicionar coluna para URL do Instagram
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS instagram_proof_url TEXT;

-- Adicionar coluna para flag de conteúdo suspeito detectado pela IA
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS ai_is_suspicious BOOLEAN DEFAULT FALSE;

-- Adicionar colunas para análise separada do Instagram
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS ai_instagram_is_valid BOOLEAN;

ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS ai_instagram_confidence INTEGER;

ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS ai_instagram_reason TEXT;

-- Comentários para documentação
COMMENT ON COLUMN challenge_participants.instagram_proof_url IS 'URL do post/reel do Instagram como prova adicional (obrigatório para atos_amor)';
COMMENT ON COLUMN challenge_participants.ai_is_suspicious IS 'Flag indicando se a IA detectou conteúdo suspeito que precisa revisão humana';
COMMENT ON COLUMN challenge_participants.ai_instagram_is_valid IS 'Resultado da análise do link do Instagram pela IA';
COMMENT ON COLUMN challenge_participants.ai_instagram_confidence IS 'Confiança da IA na análise do Instagram (0-100)';
COMMENT ON COLUMN challenge_participants.ai_instagram_reason IS 'Motivo/explicação da análise do Instagram pela IA';

-- Criar índice para filtrar participações suspeitas
CREATE INDEX IF NOT EXISTS idx_challenge_participants_suspicious
ON challenge_participants(ai_is_suspicious)
WHERE ai_is_suspicious = TRUE;
