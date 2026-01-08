-- =============================================
-- MIGRACAO: Sistema de Leads NPS
-- Execute este SQL no Supabase SQL Editor (uma unica vez)
-- =============================================

-- 1. Criar tabela de leads NPS
CREATE TABLE IF NOT EXISTS nps_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados NPS
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  reason TEXT NOT NULL,
  reason_length INTEGER GENERATED ALWAYS AS (LENGTH(reason)) STORED,

  -- Dados de contato
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),

  -- Status do lead
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Notificacoes
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent_at TIMESTAMPTZ,

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_nps_leads_status ON nps_leads(status);
CREATE INDEX IF NOT EXISTS idx_nps_leads_score ON nps_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_nps_leads_reason_length ON nps_leads(reason_length DESC);
CREATE INDEX IF NOT EXISTS idx_nps_leads_created_at ON nps_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_leads_email ON nps_leads(email);

-- 3. Habilitar RLS
ALTER TABLE nps_leads ENABLE ROW LEVEL SECURITY;

-- 4. Politicas de acesso

-- Qualquer pessoa pode inserir (formulario publico)
DROP POLICY IF EXISTS "nps_leads_insert_public" ON nps_leads;
CREATE POLICY "nps_leads_insert_public" ON nps_leads
  FOR INSERT
  WITH CHECK (true);

-- Apenas admins/creators podem ler
DROP POLICY IF EXISTS "nps_leads_select_admin" ON nps_leads;
CREATE POLICY "nps_leads_select_admin" ON nps_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- Apenas admins/creators podem atualizar
DROP POLICY IF EXISTS "nps_leads_update_admin" ON nps_leads;
CREATE POLICY "nps_leads_update_admin" ON nps_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- 5. Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_nps_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_nps_leads_updated_at ON nps_leads;
CREATE TRIGGER trigger_nps_leads_updated_at
  BEFORE UPDATE ON nps_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_nps_leads_updated_at();

-- 7. Comentarios na tabela
COMMENT ON TABLE nps_leads IS 'Leads capturados via formulario NPS da landing page';
COMMENT ON COLUMN nps_leads.score IS 'Nota NPS de 0 a 10';
COMMENT ON COLUMN nps_leads.reason IS 'Motivo/justificativa da nota dada';
COMMENT ON COLUMN nps_leads.reason_length IS 'Quantidade de caracteres no motivo (indice de prolixidade)';
COMMENT ON COLUMN nps_leads.status IS 'Status do lead: pending, approved, rejected';
