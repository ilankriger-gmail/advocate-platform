-- Migration: Adicionar campos de consentimento LGPD na tabela nps_leads
-- Campos para auditoria: consent_accepted, consent_at, consent_ip

ALTER TABLE nps_leads
ADD COLUMN IF NOT EXISTS lgpd_consent_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lgpd_consent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lgpd_consent_ip TEXT;

-- Comentarios para documentacao
COMMENT ON COLUMN nps_leads.lgpd_consent_accepted IS 'Se o usuario aceitou os termos LGPD';
COMMENT ON COLUMN nps_leads.lgpd_consent_at IS 'Data/hora do aceite LGPD';
COMMENT ON COLUMN nps_leads.lgpd_consent_ip IS 'IP do usuario no momento do aceite';
