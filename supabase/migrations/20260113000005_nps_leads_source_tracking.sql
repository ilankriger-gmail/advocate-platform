-- Migration: Adicionar campos de rastreamento de origem para nps_leads
-- Permite rastrear de qual landing page (desafio/prêmio) cada lead veio

-- Adicionar campos de origem na tabela nps_leads
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS source_type VARCHAR(30);
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS source_name VARCHAR(200);

-- Índice para filtrar por origem
CREATE INDEX IF NOT EXISTS idx_nps_leads_source ON nps_leads(source_type, source_id);

-- Comentários nas colunas
COMMENT ON COLUMN nps_leads.source_type IS 'Tipo de origem: landing_challenge, landing_reward, direct';
COMMENT ON COLUMN nps_leads.source_id IS 'ID do desafio ou prêmio que gerou o lead';
COMMENT ON COLUMN nps_leads.source_name IS 'Nome do desafio/prêmio para referência rápida';
