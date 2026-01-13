-- Migration: Configurações dos emails de onboarding (após criar conta)
-- 3 emails automáticos: Dia 0, Dia 1, Dia 3

-- Email 1: Boas-vindas (imediato)
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('email_onboarding1_subject', 'Bem-vindo à {{site_name}}! 🎉', 'Assunto do email de boas-vindas'),
  ('email_onboarding1_greeting', 'Olá {{name}}! 👋', 'Saudação do email de boas-vindas'),
  ('email_onboarding1_message', 'Sua conta foi criada com sucesso! Estamos muito felizes em ter você na nossa comunidade.', 'Mensagem principal do email de boas-vindas'),
  ('email_onboarding1_benefits', 'Participar de desafios e ganhar moedas,Completar exercícios físicos diários,Trocar moedas por prêmios incríveis,Conectar com a comunidade', 'Lista de benefícios (separados por vírgula)'),
  ('email_onboarding1_cta', 'Explorar a Plataforma', 'Texto do botão CTA'),
  ('email_onboarding1_footer', 'Qualquer dúvida, estamos aqui para ajudar!', 'Texto do rodapé')
ON CONFLICT (key) DO NOTHING;

-- Email 2: Engajamento (24h depois)
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('email_onboarding2_subject', '{{name}}, já completou seu primeiro desafio? 💪', 'Assunto do email de engajamento'),
  ('email_onboarding2_greeting', 'E aí {{name}}!', 'Saudação do email de engajamento'),
  ('email_onboarding2_message', 'Você já viu os desafios disponíveis? Complete exercícios simples e acumule moedas para trocar por prêmios!', 'Mensagem principal do email de engajamento'),
  ('email_onboarding2_benefits', 'Desafios físicos: flexões abdominais e mais,Desafios de engajamento: curta comente compartilhe,Sorteios especiais com prêmios exclusivos,Ranking para competir com outros membros', 'Lista de benefícios (separados por vírgula)'),
  ('email_onboarding2_cta', 'Ver Desafios Disponíveis', 'Texto do botão CTA'),
  ('email_onboarding2_footer', 'Quanto mais você participa, mais moedas acumula!', 'Texto do rodapé')
ON CONFLICT (key) DO NOTHING;

-- Email 3: Reengajamento (72h depois)
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('email_onboarding3_subject', '{{name}}, suas moedas estão esperando! 🪙', 'Assunto do email de reengajamento'),
  ('email_onboarding3_greeting', 'Oi {{name}}!', 'Saudação do email de reengajamento'),
  ('email_onboarding3_message', 'Você sabia que pode trocar suas moedas por prêmios incríveis? Não deixe suas moedas paradas, venha participar dos desafios!', 'Mensagem principal do email de reengajamento'),
  ('email_onboarding3_benefits', 'Prêmios exclusivos esperando por você,Novos desafios toda semana,Comunidade ativa para te apoiar,Rankings e competições especiais', 'Lista de benefícios (separados por vírgula)'),
  ('email_onboarding3_cta', 'Resgatar Prêmios', 'Texto do botão CTA'),
  ('email_onboarding3_footer', 'Não perca a chance de ganhar prêmios!', 'Texto do rodapé')
ON CONFLICT (key) DO NOTHING;

-- Tabela para rastrear onboarding de usuários
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_1_sent BOOLEAN DEFAULT false,
  email_1_sent_at TIMESTAMPTZ,
  email_2_sent BOOLEAN DEFAULT false,
  email_2_sent_at TIMESTAMPTZ,
  email_3_sent BOOLEAN DEFAULT false,
  email_3_sent_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON public.user_onboarding(completed);

-- RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas admins e o próprio usuário podem ver
CREATE POLICY "Users can view own onboarding"
  ON public.user_onboarding
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding"
  ON public.user_onboarding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND (role = 'admin' OR is_creator = true)
    )
  );

-- Service role pode fazer tudo (para CRON e sistema)
CREATE POLICY "Service role full access"
  ON public.user_onboarding
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_onboarding_updated_at ON public.user_onboarding;
CREATE TRIGGER trigger_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_user_onboarding_updated_at();
