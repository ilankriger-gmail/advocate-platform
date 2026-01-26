-- Tabela para armazenar relatórios de bugs
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  url TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'wont_fix')),
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);

-- RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode criar
CREATE POLICY "Users can create bug reports" ON bug_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Política: admins podem ver todos
CREATE POLICY "Admins can view all bug reports" ON bug_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- Política: admins podem atualizar
CREATE POLICY "Admins can update bug reports" ON bug_reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.role = 'admin' OR users.is_creator = true)
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bug_reports_updated_at ON bug_reports;
CREATE TRIGGER bug_reports_updated_at
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_reports_updated_at();
