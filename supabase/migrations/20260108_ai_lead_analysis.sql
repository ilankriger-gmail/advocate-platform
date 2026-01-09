-- AI Lead Analysis Migration
-- Adiciona campos para armazenar analise de sentimento via AI

-- =====================================================
-- 1. NOVOS CAMPOS NA TABELA nps_leads
-- =====================================================

ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(20);
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_recommendation VARCHAR(20);
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_strengths TEXT[];
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_concerns TEXT[];
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

-- =====================================================
-- 2. COMENTARIOS NOS CAMPOS
-- =====================================================

COMMENT ON COLUMN nps_leads.ai_score IS 'Score de potencial (0-100) gerado pela AI';
COMMENT ON COLUMN nps_leads.ai_sentiment IS 'Sentimento detectado: positivo, neutro, negativo';
COMMENT ON COLUMN nps_leads.ai_recommendation IS 'Recomendacao da AI: aprovar, analisar, rejeitar';
COMMENT ON COLUMN nps_leads.ai_summary IS 'Resumo da analise em 1-2 frases';
COMMENT ON COLUMN nps_leads.ai_strengths IS 'Array de pontos fortes identificados';
COMMENT ON COLUMN nps_leads.ai_concerns IS 'Array de preocupacoes identificadas';
COMMENT ON COLUMN nps_leads.ai_analyzed_at IS 'Data/hora da analise AI';

-- =====================================================
-- 3. INDICE PARA FILTRO POR SCORE AI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_nps_leads_ai_score ON nps_leads(ai_score);
CREATE INDEX IF NOT EXISTS idx_nps_leads_ai_recommendation ON nps_leads(ai_recommendation);
