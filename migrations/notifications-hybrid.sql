-- ===========================================
-- MIGRACAO: Sistema de Notificacoes Hibrido
-- Email + WhatsApp Fallback
-- ===========================================

-- ===========================================
-- TABELA: notifications_log
-- Rastreia todas as notificacoes enviadas
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia ao lead
  lead_id UUID NOT NULL REFERENCES nps_leads(id) ON DELETE CASCADE,

  -- Canal de notificacao
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'whatsapp')),

  -- Status da notificacao
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'failed', 'cancelled')),

  -- ID externo do provedor (Resend message_id ou Meta message_id)
  external_id VARCHAR(255),

  -- Metadados flexiveis (JSON)
  metadata JSONB DEFAULT '{}',
  -- Para email: { opened: boolean, opened_at: timestamp, clicks: [] }
  -- Para whatsapp: { template_name: string, delivery_status: string }

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  -- Indice unico para evitar duplicatas por canal
  UNIQUE(lead_id, channel)
);

-- Indices para notifications_log
CREATE INDEX IF NOT EXISTS idx_notifications_log_lead_id ON notifications_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_channel ON notifications_log(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_log_status ON notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_log_external_id ON notifications_log(external_id);
CREATE INDEX IF NOT EXISTS idx_notifications_log_created_at ON notifications_log(created_at DESC);

-- ===========================================
-- TABELA: scheduled_tasks
-- Fila de tarefas agendadas para o CRON
-- ===========================================
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo da tarefa
  type VARCHAR(50) NOT NULL CHECK (type IN ('check_email_opened', 'send_reminder', 'cleanup')),

  -- Referencia ao lead (opcional, depende do tipo)
  lead_id UUID REFERENCES nps_leads(id) ON DELETE CASCADE,

  -- Quando executar
  scheduled_for TIMESTAMPTZ NOT NULL,

  -- Status da tarefa
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Tentativas e erros
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,

  -- Payload flexivel (JSON)
  payload JSONB DEFAULT '{}',

  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indices para scheduled_tasks
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_for ON scheduled_tasks(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type ON scheduled_tasks(type);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_lead_id ON scheduled_tasks(lead_id);

-- Indice composto para o CRON (busca eficiente de tarefas pendentes)
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_pending ON scheduled_tasks(status, scheduled_for)
  WHERE status = 'pending';

-- ===========================================
-- ALTERACAO: nps_leads
-- Adicionar campo de opt-in WhatsApp
-- ===========================================
ALTER TABLE nps_leads
  ADD COLUMN IF NOT EXISTS whatsapp_opted_in BOOLEAN DEFAULT FALSE;

-- Atualizar leads existentes com telefone como opted_in = true
UPDATE nps_leads SET whatsapp_opted_in = TRUE WHERE phone IS NOT NULL AND whatsapp_opted_in = FALSE;

-- ===========================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ===========================================

-- Funcao para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para notifications_log
DROP TRIGGER IF EXISTS update_notifications_log_updated_at ON notifications_log;
CREATE TRIGGER update_notifications_log_updated_at
    BEFORE UPDATE ON notifications_log
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para scheduled_tasks
DROP TRIGGER IF EXISTS update_scheduled_tasks_updated_at ON scheduled_tasks;
CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- RLS Policies
-- ===========================================

-- Habilitar RLS
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Remover policies existentes se houver
DROP POLICY IF EXISTS "Service role full access notifications" ON notifications_log;
DROP POLICY IF EXISTS "Admins can view notifications_log" ON notifications_log;
DROP POLICY IF EXISTS "Service role full access tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Admins can view scheduled_tasks" ON scheduled_tasks;

-- Policy: Service role pode fazer tudo (para webhooks e cron)
CREATE POLICY "Service role full access notifications" ON notifications_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Admins/Creators podem visualizar logs de notificacao
CREATE POLICY "Admins can view notifications_log" ON notifications_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );

-- Policy: Service role pode fazer tudo nas tarefas
CREATE POLICY "Service role full access tasks" ON scheduled_tasks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Admins/Creators podem visualizar tarefas
CREATE POLICY "Admins can view scheduled_tasks" ON scheduled_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'creator' OR users.is_creator = true)
    )
  );

-- ===========================================
-- COMENTARIOS
-- ===========================================
COMMENT ON TABLE notifications_log IS 'Rastreia todas as notificacoes enviadas (email e whatsapp)';
COMMENT ON TABLE scheduled_tasks IS 'Fila de tarefas agendadas para processamento pelo CRON';
COMMENT ON COLUMN notifications_log.external_id IS 'ID do provedor externo (Resend message_id ou Meta message_id)';
COMMENT ON COLUMN notifications_log.metadata IS 'Metadados flexiveis: email={opened,clicked}, whatsapp={template,status}';
COMMENT ON COLUMN scheduled_tasks.type IS 'Tipo: check_email_opened (verificar abertura), send_reminder, cleanup';
COMMENT ON COLUMN scheduled_tasks.payload IS 'Dados extras necessarios para executar a tarefa';
COMMENT ON COLUMN nps_leads.whatsapp_opted_in IS 'Se o lead optou por receber notificacoes via WhatsApp';
