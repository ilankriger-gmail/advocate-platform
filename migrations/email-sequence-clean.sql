ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 0;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS converted BOOLEAN DEFAULT FALSE;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE nps_leads ADD COLUMN IF NOT EXISTS converted_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_nps_leads_sequence_step ON nps_leads(sequence_step);
CREATE INDEX IF NOT EXISTS idx_nps_leads_converted ON nps_leads(converted);
ALTER TABLE notifications_log ADD COLUMN IF NOT EXISTS sequence_step INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_notifications_log_step ON notifications_log(sequence_step);
