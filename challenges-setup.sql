-- =====================================================
-- SISTEMA DE DESAFIOS
-- Execute no Supabase SQL Editor
-- =====================================================

-- Limpar tabelas antigas se existirem
DROP TABLE IF EXISTS public.challenge_completions CASCADE;
DROP TABLE IF EXISTS public.challenges CASCADE;

-- Tabela de desafios
CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'special')),
  coins_reward INTEGER NOT NULL CHECK (coins_reward > 0),
  icon VARCHAR(10) DEFAULT '🎯',
  requirements JSONB, -- Ex: {"action": "create_post", "count": 1}
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de conclusoes de desafios
CREATE TABLE public.challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  coins_earned INTEGER NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

-- Policies para challenges
CREATE POLICY "Challenges viewable by all authenticated" ON public.challenges
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Policies para challenge_completions
CREATE POLICY "Users view own completions" ON public.challenge_completions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own completions" ON public.challenge_completions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indices
CREATE INDEX idx_challenges_type ON public.challenges(type);
CREATE INDEX idx_challenges_is_active ON public.challenges(is_active);
CREATE INDEX idx_challenge_completions_user_id ON public.challenge_completions(user_id);
CREATE INDEX idx_challenge_completions_challenge_id ON public.challenge_completions(challenge_id);

-- =====================================================
-- DESAFIOS DE TESTE
-- =====================================================

INSERT INTO public.challenges (title, description, type, coins_reward, icon, requirements) VALUES
  -- Desafios Diarios
  ('Primeiro Post do Dia', 'Crie um post hoje para ganhar moedas', 'daily', 10, '📝', '{"action": "create_post", "count": 1}'),
  ('Engajamento Social', 'Curta 3 posts de outros membros', 'daily', 15, '❤️', '{"action": "like_posts", "count": 3}'),
  ('Comentarista', 'Deixe um comentario em um post', 'daily', 10, '💬', '{"action": "comment", "count": 1}'),

  -- Desafios Semanais
  ('Criador de Conteudo', 'Publique 5 posts esta semana', 'weekly', 100, '🚀', '{"action": "create_post", "count": 5}'),
  ('Influenciador', 'Receba 20 curtidas nos seus posts', 'weekly', 150, '⭐', '{"action": "receive_likes", "count": 20}'),
  ('Networking', 'Comente em 10 posts diferentes', 'weekly', 75, '🤝', '{"action": "comment", "count": 10}'),

  -- Desafios Mensais
  ('Super Advocate', 'Complete 20 desafios este mes', 'monthly', 500, '🏆', '{"action": "complete_challenges", "count": 20}'),
  ('Viral', 'Tenha um post com mais de 50 curtidas', 'monthly', 300, '🔥', '{"action": "viral_post", "likes": 50}'),

  -- Desafios Especiais
  ('Bem-vindo!', 'Complete seu perfil com foto e bio', 'special', 50, '👋', '{"action": "complete_profile"}'),
  ('Primeira Conexao', 'Conecte sua conta do Instagram', 'special', 100, '📸', '{"action": "connect_instagram"}');
