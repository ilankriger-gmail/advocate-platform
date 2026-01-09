-- Migration: Adicionar configurações de API ao site_settings
-- Data: 2026-01-09

INSERT INTO site_settings (key, value, label, description, field_type) VALUES
  ('openai_api_key', '', 'Chave OpenAI', 'Chave de API da OpenAI para funcionalidades de IA', 'text'),
  ('resend_api_key', '', 'Chave Resend', 'Chave de API do Resend para envio de emails', 'text'),
  ('meta_pixel_id', '', 'Meta Pixel ID', 'ID do pixel do Meta/Facebook para tracking', 'text'),
  ('meta_access_token', '', 'Meta Access Token', 'Token de acesso da API do Meta/WhatsApp', 'text'),
  ('whatsapp_phone_number_id', '', 'WhatsApp Phone ID', 'ID do número de telefone do WhatsApp Business', 'text'),
  ('whatsapp_access_token', '', 'WhatsApp Token', 'Token de acesso para API do WhatsApp', 'text')
ON CONFLICT (key) DO NOTHING;
