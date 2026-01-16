-- Adicionar novas configurações de API para integrações
-- Gemini (análise de vídeos)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('gemini_api_key', '', 'Gemini API Key', 'Chave da API do Google Gemini para análise automática de vídeos', 'password')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

-- Resend (email remetente)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('resend_from_email', '', 'Email Remetente', 'Email usado como remetente nos envios (ex: noreply@seu-dominio.com)', 'text')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

-- WhatsApp (configurações adicionais)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('whatsapp_app_secret', '', 'WhatsApp App Secret', 'Secret do app Meta para validar assinatura de webhooks', 'password')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('whatsapp_webhook_verify_token', '', 'WhatsApp Verify Token', 'Token para verificação do webhook da Meta', 'password')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

-- YouTube
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('youtube_api_key', '', 'YouTube API Key', 'Chave da API do YouTube Data v3 para buscar vídeos', 'password')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('youtube_channel_handle', '', 'Canal YouTube', 'Handle do canal YouTube (ex: @seu_canal)', 'text')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;

-- Atualizar labels e descriptions das configurações existentes para melhor clareza
UPDATE site_settings SET
  label = 'OpenAI API Key',
  description = 'Chave da API OpenAI para geração de thumbnails (DALL-E) e análise de leads (GPT-4)'
WHERE key = 'openai_api_key';

UPDATE site_settings SET
  label = 'Resend API Key',
  description = 'Chave da API Resend para envio de emails transacionais'
WHERE key = 'resend_api_key';

UPDATE site_settings SET
  label = 'WhatsApp Phone Number ID',
  description = 'ID do número de telefone WhatsApp Business (Meta)'
WHERE key = 'whatsapp_phone_number_id';

UPDATE site_settings SET
  label = 'WhatsApp Access Token',
  description = 'Token de acesso para API do WhatsApp (Meta)'
WHERE key = 'whatsapp_access_token';

UPDATE site_settings SET
  label = 'Meta Pixel ID',
  description = 'ID do Pixel do Meta para rastreamento de conversões'
WHERE key = 'meta_pixel_id';

UPDATE site_settings SET
  label = 'Meta Access Token',
  description = 'Token de acesso para API de Conversões do Meta'
WHERE key = 'meta_access_token';
