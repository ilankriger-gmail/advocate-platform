CREATE OR REPLACE VIEW email_sequence_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') as total_approved,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 1) as email_1_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 2) as email_2_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND sequence_step >= 3) as whatsapp_sent,
  COUNT(*) FILTER (WHERE status = 'approved' AND converted = true) as converted,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'approved' AND converted = true) / NULLIF(COUNT(*) FILTER (WHERE status = 'approved'), 0), 2) as conversion_rate
FROM nps_leads;

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
