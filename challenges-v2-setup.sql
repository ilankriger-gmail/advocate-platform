-- =====================================================
-- SISTEMA DE DESAFIOS V2
-- Execute no Supabase SQL Editor
-- =====================================================

-- Limpar tabelas antigas
DROP TABLE IF EXISTS public.challenge_completions CASCADE;
DROP TABLE IF EXISTS public.challenge_participants CASCADE;
DROP TABLE IF EXISTS public.challenge_winners CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;

-- =====================================================
-- TABELA PRINCIPAL DE DESAFIOS
-- =====================================================
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informações básicas
  title VARCHAR(150) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('engajamento', 'fisico')),
  icon VARCHAR(10) DEFAULT '🎯',
  is_active BOOLEAN DEFAULT true,

  -- Para ENGAJAMENTO: sorteio no Instagram
  instagram_embed_url TEXT,           -- URL do post/vídeo do Instagram
  prize_amount DECIMAL(10,2),         -- Valor do prêmio em R$
  num_winners INTEGER DEFAULT 1,      -- Quantidade de ganhadores

  -- Para FÍSICO: metas e recordes
  goal_type VARCHAR(20),              -- 'repetitions' ou 'time' (segundos)
  goal_value INTEGER,                 -- Meta a bater (ex: 50 flexões ou 120 segundos)
  record_video_url TEXT,              -- Vídeo do recorde do canal
  hashtag VARCHAR(50),                -- Hashtag obrigatória (ex: #DesafioAdvocate)
  profile_to_tag VARCHAR(50),         -- Perfil para marcar (ex: @teamo)
  coins_reward INTEGER DEFAULT 0,     -- Corações ganhos ao completar

  -- Controle
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'finished')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PARTICIPAÇÕES NOS DESAFIOS FÍSICOS
-- =====================================================
CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,

  -- Resultado
  result_value INTEGER,               -- Repetições ou tempo em segundos
  video_proof_url TEXT,               -- Link do vídeo publicado
  social_media_url TEXT,              -- Link da publicação nas redes

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,

  -- Corações ganhos
  coins_earned INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- =====================================================
-- GANHADORES DOS SORTEIOS (ENGAJAMENTO)
-- =====================================================
CREATE TABLE public.challenge_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  -- Pode ser alguém que não está cadastrado (só comentou no Instagram)
  instagram_username VARCHAR(50),

  -- Prêmio
  prize_amount DECIMAL(10,2),
  pix_sent BOOLEAN DEFAULT false,
  proof_image_url TEXT,               -- Comprovante do Pix

  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_winners ENABLE ROW LEVEL SECURITY;

-- Todos podem ver desafios ativos
CREATE POLICY "Challenges viewable by all" ON public.challenges
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Usuários veem suas participações
CREATE POLICY "Users view own participations" ON public.challenge_participants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Todos podem ver ranking (participações aprovadas)
CREATE POLICY "Anyone can view approved participations" ON public.challenge_participants
  FOR SELECT TO authenticated
  USING (status = 'approved');

-- Usuários podem participar
CREATE POLICY "Users can participate" ON public.challenge_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver ganhadores
CREATE POLICY "Anyone can view winners" ON public.challenge_winners
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_challenges_type ON public.challenges(type);
CREATE INDEX idx_challenges_status ON public.challenges(status);
CREATE INDEX idx_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX idx_participants_user ON public.challenge_participants(user_id);
CREATE INDEX idx_participants_ranking ON public.challenge_participants(challenge_id, result_value DESC);
CREATE INDEX idx_winners_challenge ON public.challenge_winners(challenge_id);

-- =====================================================
-- DESAFIOS DE EXEMPLO
-- =====================================================

-- Desafio de Engajamento
INSERT INTO public.challenges (
  title, description, type, icon,
  instagram_embed_url, prize_amount, num_winners
) VALUES (
  'Sorteio Te Amo ❤️',
  'Comente no post do Instagram para concorrer! 5 ganhadores vão receber R$20 no Pix.',
  'engajamento',
  '🎁',
  'https://www.instagram.com/p/EXEMPLO',
  20.00,
  5
);

-- Desafios Físicos
INSERT INTO public.challenges (
  title, description, type, icon,
  goal_type, goal_value, record_video_url,
  hashtag, profile_to_tag, coins_reward
) VALUES
(
  'Desafio das Flexões 💪',
  'Bata meu recorde de 50 flexões! Grave um vídeo e poste nas redes.',
  'fisico',
  '💪',
  'repetitions',
  50,
  'https://youtube.com/watch?v=EXEMPLO',
  '#DesafioTeAmo',
  '@teamo',
  100
),
(
  'Prancha de Resistência 🧘',
  'Aguente mais de 2 minutos na prancha! Supere meu tempo.',
  'fisico',
  '🧘',
  'time',
  120,
  'https://youtube.com/watch?v=EXEMPLO2',
  '#DesafioTeAmo',
  '@teamo',
  100
),
(
  'Agachamentos Explosivos 🦵',
  'Complete 100 agachamentos e mostre sua força!',
  'fisico',
  '🦵',
  'repetitions',
  100,
  'https://youtube.com/watch?v=EXEMPLO3',
  '#DesafioTeAmo',
  '@teamo',
  150
);
