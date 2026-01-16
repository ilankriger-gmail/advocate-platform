-- Adicionar configuração para Google Perspective API (moderação de texto)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES ('perspective_api_key', '', 'Perspective API Key', 'Chave da API Google Perspective para moderação de texto (toxicidade, insultos). Gratuita: 1M req/dia', 'password')
ON CONFLICT (key) DO UPDATE SET label = EXCLUDED.label, description = EXCLUDED.description, field_type = EXCLUDED.field_type;
