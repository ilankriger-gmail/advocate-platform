-- Migration: Add email_broadcasts table and phone column to users
-- Date: 2025-06-14

-- 1. Tabela de histórico de broadcasts
CREATE TABLE IF NOT EXISTS email_broadcasts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subject text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  cta_text text,
  cta_url text,
  audience_filter text NOT NULL DEFAULT 'Todos',
  recipients_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  sent_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE email_broadcasts ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver/inserir broadcasts
CREATE POLICY "Admins can manage broadcasts" ON email_broadcasts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 2. Adicionar coluna phone na tabela users (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
END $$;
