-- Tabela para campanhas do Link do Bem (sincronizadas automaticamente)
CREATE TABLE IF NOT EXISTS linkdobem_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_id INTEGER UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  url TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_linkdobem_campaigns_active ON linkdobem_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_linkdobem_campaigns_wp_id ON linkdobem_campaigns(wp_id);

-- Permitir acesso público para leitura (campanhas são públicas)
ALTER TABLE linkdobem_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campanhas visíveis para todos" ON linkdobem_campaigns
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar" ON linkdobem_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
