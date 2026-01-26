-- Tabela de configuração de tarefas de engajamento
-- Define quais ações dão corações e quanto

CREATE TABLE IF NOT EXISTS engagement_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL, -- identificador único (ex: 'profile_bio', 'profile_avatar')
  name text NOT NULL, -- nome para exibição
  description text, -- descrição da tarefa
  category text NOT NULL DEFAULT 'profile', -- categoria (profile, content, social, special)
  hearts_reward integer NOT NULL DEFAULT 1, -- quantos corações dá
  is_active boolean NOT NULL DEFAULT true, -- se está ativa
  is_repeatable boolean NOT NULL DEFAULT false, -- se pode repetir (ex: login diário)
  max_per_day integer, -- limite por dia se repetível
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de tarefas completadas por usuário
CREATE TABLE IF NOT EXISTS user_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES engagement_tasks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  hearts_earned integer NOT NULL DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_engagement_tasks_slug ON engagement_tasks(slug);
CREATE INDEX IF NOT EXISTS idx_engagement_tasks_category ON engagement_tasks(category);
CREATE INDEX IF NOT EXISTS idx_engagement_tasks_active ON engagement_tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_user ON user_task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_task ON user_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_user_task_completions_date ON user_task_completions(completed_at);

-- Unique constraint para tarefas não repetíveis
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_task_unique 
ON user_task_completions(user_id, task_id) 
WHERE NOT EXISTS (
  SELECT 1 FROM engagement_tasks et 
  WHERE et.id = task_id AND et.is_repeatable = true
);

-- Inserir tarefas padrão de perfil
INSERT INTO engagement_tasks (slug, name, description, category, hearts_reward, is_repeatable) VALUES
  -- Perfil
  ('profile_name', 'Adicionar nome', 'Preencher seu nome completo', 'profile', 1, false),
  ('profile_avatar', 'Adicionar foto', 'Fazer upload de uma foto de perfil', 'profile', 1, false),
  ('profile_bio', 'Escrever bio', 'Adicionar uma bio ao seu perfil', 'profile', 1, false),
  ('profile_instagram', 'Conectar Instagram', 'Adicionar seu @ do Instagram', 'profile', 1, false),
  ('profile_tiktok', 'Conectar TikTok', 'Adicionar seu @ do TikTok', 'profile', 1, false),
  ('profile_youtube', 'Conectar YouTube', 'Adicionar seu canal do YouTube', 'profile', 1, false),
  ('profile_twitter', 'Conectar Twitter/X', 'Adicionar seu @ do Twitter', 'profile', 1, false),
  ('profile_website', 'Adicionar link', 'Adicionar seu link pessoal', 'profile', 1, false),
  
  -- Conteúdo
  ('content_first_post', 'Primeiro post', 'Criar seu primeiro post', 'content', 2, false),
  ('content_post', 'Criar post', 'Criar um novo post', 'content', 1, true),
  ('content_like', 'Curtir post', 'Curtir um post de outro usuário', 'content', 1, true),
  ('content_comment', 'Comentar', 'Comentar em um post', 'content', 1, true),
  ('content_save', 'Salvar post', 'Salvar um post nos favoritos', 'content', 1, true),
  
  -- Social
  ('social_follow', 'Seguir alguém', 'Seguir outro usuário', 'social', 1, true),
  ('social_invite', 'Convidar amigo', 'Convidar um amigo pelo link', 'social', 2, true),
  ('social_invite_accepted', 'Amigo aceitou', 'Um amigo entrou pelo seu convite', 'social', 3, true),
  
  -- Engajamento
  ('engagement_daily_login', 'Login diário', 'Entrar na plataforma', 'engagement', 1, true),
  ('engagement_streak_7', 'Streak 7 dias', 'Entrar 7 dias seguidos', 'engagement', 5, true),
  ('engagement_streak_30', 'Streak 30 dias', 'Entrar 30 dias seguidos', 'engagement', 15, true)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE engagement_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_completions ENABLE ROW LEVEL SECURITY;

-- Políticas para engagement_tasks (todos podem ler, só admin altera)
CREATE POLICY "Anyone can read active tasks"
ON engagement_tasks FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage tasks"
ON engagement_tasks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role = 'admin'
  )
);

-- Políticas para user_task_completions
CREATE POLICY "Users can see own completions"
ON user_task_completions FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can insert completions"
ON user_task_completions FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Grant acesso público para tarefas
GRANT SELECT ON engagement_tasks TO anon, authenticated;
GRANT SELECT, INSERT ON user_task_completions TO authenticated;
