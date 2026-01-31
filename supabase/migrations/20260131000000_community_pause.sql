-- Community Pause System
-- Adds site_settings entries for community pause functionality

-- Insert pause settings (only if they don't exist)
INSERT INTO site_settings (key, value, label, description, field_type)
VALUES 
  ('community_paused', 'false', 'Comunidade Pausada', 'Quando true, redireciona usuários para página de pausa', 'toggle'),
  ('community_pause_message', 'A comunidade Arena Te Amo está temporariamente em pausa para melhorias. Estamos trabalhando para trazer uma experiência ainda mais incrível pra você.', 'Mensagem de Pausa', 'Mensagem exibida na página de pausa', 'textarea'),
  ('community_pause_reopen_date', '', 'Previsão de Retorno', 'Data estimada de reabertura (ex: Fevereiro de 2026)', 'text')
ON CONFLICT (key) DO NOTHING;
