-- NPS Auto-Approval Settings Migration
-- Adiciona configurações para auto-aprovação de leads NPS

INSERT INTO site_settings (key, value, label, description, field_type) VALUES
  ('nps_auto_approval_enabled', 'true', 'Auto-Aprovação NPS', 'Habilita aprovação automática de leads com score AI alto', 'toggle'),
  ('nps_auto_approval_min_score', '70', 'Score Mínimo Auto-Aprovação', 'Score AI mínimo (0-100) para auto-aprovar um lead', 'number')
ON CONFLICT (key) DO NOTHING;
