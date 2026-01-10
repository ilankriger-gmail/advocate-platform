-- Migration: Sistema de Sequencia de Emails
-- Adiciona campos para controlar sequencia de emails e tracking de conversao

-- 1. Adicionar campos de sequencia em nps_leads
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS
  sequence_step INTEGER DEFAULT 0;
-- 0 = nao iniciou, 1 = email1 enviado, 2 = email2 enviado, 3 = whatsapp enviado

ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS
  converted BOOLEAN DEFAULT FALSE;

ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS
  converted_at TIMESTAMPTZ;

ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS
  converted_user_id UUID;

-- Indice para buscar leads por etapa da sequencia
CREATE INDEX IF NOT EXISTS idx_nps_leads_sequence_step ON nps_leads(sequence_step);

-- Indice para buscar leads convertidos
CREATE INDEX IF NOT EXISTS idx_nps_leads_converted ON nps_leads(converted);

-- 2. Adicionar campo step em notifications_log para rastrear qual email foi
ALTER TABLE notifications_log ADD COLUMN IF NOT EXISTS
  sequence_step INTEGER DEFAULT 1;

-- Indice para buscar notificacoes por step
CREATE INDEX IF NOT EXISTS idx_notifications_log_step ON notifications_log(sequence_step);

-- 3. Inserir configuracoes do Email 2 (follow-up)
INSERT INTO site_settings (key, value, label, description, field_type) VALUES
('email_followup_subject', 'Ainda da tempo de entrar no {{site_name}}!', 'Assunto Email 2', 'Assunto do segundo email de follow-up', 'text'),
('email_followup_greeting', 'Ola {{name}}!', 'Saudacao Email 2', 'Saudacao do email de follow-up', 'text'),
('email_followup_message', 'Percebemos que voce ainda nao criou sua conta na nossa comunidade. Essa e sua ultima chance de garantir acesso a conteudos exclusivos, desafios e premios incriveis!', 'Mensagem Email 2', 'Corpo do email de follow-up', 'textarea'),
('email_followup_benefits', 'Conteudos exclusivos do criador,Desafios com premios reais,Comunidade engajada,Acesso antecipado a novidades', 'Beneficios Email 2', 'Lista de beneficios separados por virgula', 'textarea'),
('email_followup_cta', 'Criar Minha Conta Agora', 'Botao Email 2', 'Texto do botao CTA do follow-up', 'text'),
('email_followup_footer', 'Nao perca essa oportunidade unica!', 'Rodape Email 2', 'Texto do rodape do follow-up', 'text')
ON CONFLICT (key) DO NOTHING;

-- 4. Adicionar novos tipos de tarefa agendada
-- O campo type em scheduled_tasks ja e VARCHAR, entao suporta novos valores:
-- 'send_email_2' - Enviar segundo email
-- 'send_whatsapp_final' - Enviar WhatsApp final
-- 'check_conversion' - Verificar se converteu (generico)

-- 5. View para metricas de sequencia (facilita queries no dashboard)
CREATE OR REPLACE VIEW email_sequence_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') as total_approved,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 1) as email_1_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 2) as email_2_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 3) as whatsapp_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND converted = true) as converted,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'approved' AND converted = true) /
    NULLIF(COUNT(*) FILTER (WHERE status = 'approved'), 0),
    2
  ) as conversion_rate
FROM nps_leads;

-- 6. View para funil de sequencia
CREATE OR REPLACE VIEW email_sequence_funnel AS
SELECT
  sequence_step,
  CASE sequence_step
    WHEN 0 THEN 'Aguardando'
    WHEN 1 THEN 'Email 1 Enviado'
    WHEN 2 THEN 'Email 2 Enviado'
    WHEN 3 THEN 'WhatsApp Enviado'
  END as step_name,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE converted = true) as converted_count
FROM nps_leads
WHERE status = 'approved'
GROUP BY sequence_step
ORDER BY sequence_step;

-- 7. Comentarios nas colunas para documentacao
COMMENT ON COLUMN nps_leads.sequence_step IS '0=nao iniciou, 1=email1, 2=email2, 3=whatsapp';
COMMENT ON COLUMN nps_leads.converted IS 'Lead criou conta e fez primeiro login';
COMMENT ON COLUMN nps_leads.converted_at IS 'Data/hora da conversao';
COMMENT ON COLUMN nps_leads.converted_user_id IS 'ID do usuario criado a partir do lead';
COMMENT ON COLUMN notifications_log.sequence_step IS 'Etapa da sequencia (1=email1, 2=email2, 3=whatsapp)';
