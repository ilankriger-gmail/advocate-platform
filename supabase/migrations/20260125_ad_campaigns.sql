-- Tabela de campanhas de anúncios (Link do Bem)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações básicas
  name TEXT NOT NULL,
  description TEXT,
  
  -- URL da campanha (ex: https://linkdobem.org/isaias-ganhe-10mil/)
  original_url TEXT NOT NULL,
  
  -- UTM automático (será adicionado ao original_url)
  utm_source TEXT DEFAULT 'site_teamo_MAIS',
  
  -- Imagens para diferentes formatos de banner
  image_square TEXT,      -- 1:1 (300x300) - feed mobile
  image_horizontal TEXT,  -- 16:9 (728x90) - header/footer
  image_vertical TEXT,    -- 9:16 (300x600) - sidebar
  image_card TEXT,        -- 4:3 (400x300) - cards
  
  -- Texto do CTA
  cta_text TEXT DEFAULT 'Ajudar agora',
  
  -- Tags para matching com conteúdo (ex: familia, crianca, saude)
  tags TEXT[] DEFAULT '{}',
  
  -- Controle de exibição
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- maior = mais prioridade
  
  -- Período de exibição (opcional)
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Estatísticas
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cliques (para analytics detalhado)
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  
  -- Contexto do clique
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  page_url TEXT,           -- onde o banner estava
  banner_type TEXT,        -- square, horizontal, vertical, card
  banner_position TEXT,    -- feed, sidebar, header, footer
  
  -- Dados do dispositivo
  user_agent TEXT,
  referrer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON ad_campaigns(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_priority ON ad_campaigns(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_date ON ad_clicks(created_at);

-- RLS
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

-- Políticas - campanhas visíveis para todos, editáveis por admin
CREATE POLICY "Campanhas ativas são públicas" ON ad_campaigns
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem ver todas as campanhas" ON ad_campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins podem criar campanhas" ON ad_campaigns
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins podem editar campanhas" ON ad_campaigns
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins podem deletar campanhas" ON ad_campaigns
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Cliques - qualquer um pode registrar, só admin pode ver
CREATE POLICY "Qualquer um pode registrar clique" ON ad_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem ver cliques" ON ad_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Função para registrar clique e incrementar contador
CREATE OR REPLACE FUNCTION register_ad_click(
  p_campaign_id UUID,
  p_page_url TEXT DEFAULT NULL,
  p_banner_type TEXT DEFAULT NULL,
  p_banner_position TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_click_id UUID;
  v_user_id UUID;
BEGIN
  -- Pegar user_id se autenticado
  v_user_id := auth.uid();
  
  -- Inserir clique
  INSERT INTO ad_clicks (campaign_id, user_id, page_url, banner_type, banner_position, user_agent, referrer)
  VALUES (p_campaign_id, v_user_id, p_page_url, p_banner_type, p_banner_position, p_user_agent, p_referrer)
  RETURNING id INTO v_click_id;
  
  -- Incrementar contador na campanha
  UPDATE ad_campaigns SET clicks = clicks + 1, updated_at = NOW()
  WHERE id = p_campaign_id;
  
  RETURN v_click_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar impressões
CREATE OR REPLACE FUNCTION register_ad_impression(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE ad_campaigns SET impressions = impressions + 1
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_ad_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ad_campaigns_updated_at ON ad_campaigns;
CREATE TRIGGER trigger_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_ad_campaigns_updated_at();
