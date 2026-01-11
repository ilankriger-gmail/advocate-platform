-- Migration: Adicionar campos de análise de IA nas participações de desafios
-- Data: 2026-01-12
-- Descrição: Armazena o resultado da análise de vídeo feita pelo Gemini

ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS ai_is_valid BOOLEAN,
ADD COLUMN IF NOT EXISTS ai_confidence INTEGER,
ADD COLUMN IF NOT EXISTS ai_reason TEXT,
ADD COLUMN IF NOT EXISTS ai_observed_value INTEGER,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN challenge_participants.ai_is_valid IS 'Se a IA considerou o desafio válido';
COMMENT ON COLUMN challenge_participants.ai_confidence IS 'Nível de confiança da IA (0-100)';
COMMENT ON COLUMN challenge_participants.ai_reason IS 'Motivo/explicação da análise da IA';
COMMENT ON COLUMN challenge_participants.ai_observed_value IS 'Valor observado pela IA (repetições ou segundos)';
COMMENT ON COLUMN challenge_participants.ai_analyzed_at IS 'Data/hora da análise pela IA';
