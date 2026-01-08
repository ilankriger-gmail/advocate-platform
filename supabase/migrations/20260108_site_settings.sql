-- Site Settings Migration
-- Permite configurações editáveis da comunidade

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  label VARCHAR(200), -- Label amigável para o admin
  description TEXT, -- Descrição do campo
  field_type VARCHAR(50) DEFAULT 'text', -- text, textarea, url, email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por key
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- =====================================================
-- 2. DADOS INICIAIS
-- =====================================================

INSERT INTO site_settings (key, value, label, description, field_type) VALUES
  ('site_name', 'NextLOVERS', 'Nome do Site', 'Nome principal exibido no header e títulos', 'text'),
  ('site_description', 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ', 'Descrição do Site', 'Descrição completa para SEO e meta tags', 'textarea'),
  ('creator_name', 'O Moço do Te Amo', 'Nome do Criador', 'Nome do criador/artista principal', 'text'),
  ('creator_handle', 'NextlevelDJ', 'Handle do Criador', 'Nome artístico ou handle nas redes sociais', 'text'),
  ('hero_title', 'Comunidade NextLOVERS', 'Título do Hero', 'Título principal na página inicial', 'text'),
  ('hero_subtitle', 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ', 'Subtítulo do Hero', 'Subtítulo exibido abaixo do título principal', 'textarea'),
  ('login_title', 'NextLOVERS', 'Título do Login', 'Título na página de login', 'text'),
  ('login_subtitle', 'Comunidade oficial de O Moço do Te Amo', 'Subtítulo do Login', 'Subtítulo na página de login', 'text'),
  ('meta_title', 'NextLOVERS - Comunidade O Moço do Te Amo', 'Título SEO', 'Título para mecanismos de busca (title tag)', 'text'),
  ('meta_description', 'Comunidade oficial de O Moço do Te Amo | NextlevelDJ', 'Descrição SEO', 'Descrição para mecanismos de busca (meta description)', 'textarea'),
  ('email_from_name', 'NextLOVERS', 'Nome do Remetente', 'Nome exibido nos emails enviados', 'text'),
  ('footer_text', 'O Moço do Te Amo - Comunidade NextLOVERS', 'Texto do Rodapé', 'Texto exibido no rodapé das páginas', 'text')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_site_settings_updated_at ON site_settings;
CREATE TRIGGER trigger_site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW EXECUTE FUNCTION update_site_settings_updated_at();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler as configurações
CREATE POLICY "Anyone can read site settings" ON site_settings
  FOR SELECT USING (true);

-- Apenas criadores (admins) podem atualizar
CREATE POLICY "Only creators can update site settings" ON site_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_creator = true)
  );

-- Apenas criadores podem inserir novas configurações
CREATE POLICY "Only creators can insert site settings" ON site_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_creator = true)
  );

-- Apenas criadores podem deletar
CREATE POLICY "Only creators can delete site settings" ON site_settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_creator = true)
  );
