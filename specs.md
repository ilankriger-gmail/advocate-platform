# Especificação MVP - Plataforma de Advocate Marketing

## Visão Geral
A plataforma de Advocate Marketing tem como objetivo conectar marcas com seus defensores (advocates) mais engajados, permitindo que compartilhem conteúdo, participem de eventos exclusivos e gerem valor tanto para a marca quanto para si mesmos.

## Funcionalidades Principais

### 1. Feed Unificado
- Agregação de posts do Instagram e TikTok em um único feed
- Funcionalidades:
  - Visualização de conteúdo por data, popularidade ou relevância
  - Filtros por tags, marcas ou categorias
  - Preview de posts com métricas básicas (curtidas, compartilhamentos)
  - Link direto para o post original
- Implementação técnica:
  - Integração com APIs do Instagram e TikTok
  - Armazenamento de metadados no Supabase
  - Atualização periódica via webhooks ou cron jobs

### 2. Sistema de Eventos Exclusivos
- Eventos virtuais ou presenciais disponíveis apenas para advocates qualificados
- Funcionalidades:
  - Listagem de eventos futuros com detalhes
  - Sistema de registro com confirmação
  - Controle de acesso baseado em nível de advocate
  - Lembretes automáticos via email
  - Certificados de participação
- Implementação técnica:
  - Calendário interativo
  - Integração com serviço de email
  - QR codes para check-in em eventos presenciais

### 3. Autenticação Social
- Login via Google e Instagram
- Funcionalidades:
  - Registro simplificado com OAuth
  - Vinculação de contas existentes
  - Perfil de usuário com informações básicas
  - Configurações de privacidade
- Implementação técnica:
  - Supabase Auth com provedores sociais
  - Permissões de leitura para métricas básicas de redes sociais

## Modelo de Dados

### 1. Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  advocate_level INTEGER DEFAULT 1, -- Nível de advocate (1-5)
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT NOT NULL DEFAULT 'advocate' CHECK (role IN ('admin', 'advocate')) -- Papel do usuário na plataforma
);
```

### 2. Posts
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT[],
  type TEXT NOT NULL CHECK (type IN ('creator', 'community')), -- Tipo do post: creator (criado pelo advocate) ou community (criado pela comunidade)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rejection_reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);
```

### 3. Post Likes
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(post_id, user_id) -- Evita que um usuário curta o mesmo post múltiplas vezes
);
```

### 4. Post Comments
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE -- Soft delete para manter histórico de conversas
);
```

### 5. Events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT, -- Pode ser link para evento virtual
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  required_level INTEGER DEFAULT 1, -- Nível mínimo de advocate para participar
  is_virtual BOOLEAN DEFAULT TRUE,
  meeting_url TEXT, -- Para eventos virtuais
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### 6. Event Registrations
```sql
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  registration_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  feedback TEXT,

  UNIQUE(event_id, user_id)
);
```

### 7. External Submissions
```sql
CREATE TABLE external_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- Plataforma onde o conteúdo foi submetido (Instagram, TikTok, YouTube)
  content_url TEXT NOT NULL, -- URL para o conteúdo na plataforma externa
  content_type TEXT NOT NULL, -- Tipo de conteúdo (post, story, reel, video, etc.)
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  metrics JSONB, -- Métricas como visualizações, curtidas, compartilhamentos, etc.
  notes TEXT, -- Notas adicionais sobre a submissão
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Políticas de Segurança (RLS)

### 1. Users
```sql
-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam informações básicas de outros usuários
CREATE POLICY users_view_public_data ON users
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir que usuários vejam todos os seus próprios dados
CREATE POLICY users_view_own_data ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Política para permitir que administradores vejam todos os dados
CREATE POLICY users_admin_view_all ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários atualizem seus próprios dados (exceto role)
CREATE POLICY users_update_own_data ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND (OLD.role = NEW.role));

-- Política para permitir que administradores atualizem qualquer dado
CREATE POLICY users_admin_update_all ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 2. Posts
```sql
-- Habilitar RLS na tabela posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam posts aprovados
CREATE POLICY posts_view_approved ON posts
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Política para permitir que usuários vejam seus próprios posts
CREATE POLICY posts_view_own ON posts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para permitir que administradores vejam todos os posts
CREATE POLICY posts_admin_view_all ON posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários criem posts
CREATE POLICY posts_insert_own ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND status = 'pending'
  );

-- Política para permitir que usuários atualizem seus próprios posts pendentes
CREATE POLICY posts_update_own_pending ON posts
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid() AND status = 'pending'
  );

-- Política para permitir que administradores atualizem qualquer post
CREATE POLICY posts_admin_update_all ON posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 3. Post Likes
```sql
-- Habilitar RLS na tabela post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário veja curtidas em posts aprovados
CREATE POLICY post_likes_view_approved ON post_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_likes.post_id
      AND status = 'approved'
    )
  );

-- Política para permitir que administradores vejam todas as curtidas
CREATE POLICY post_likes_admin_view_all ON post_likes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários curtam posts aprovados
CREATE POLICY post_likes_insert_approved ON post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_likes.post_id
      AND status = 'approved'
    )
  );

-- Política para permitir que usuários removam suas próprias curtidas
CREATE POLICY post_likes_delete_own ON post_likes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
```

### 4. Post Comments
```sql
-- Habilitar RLS na tabela post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário veja comentários em posts aprovados
CREATE POLICY post_comments_view_approved ON post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_comments.post_id
      AND status = 'approved'
    )
  );

-- Política para permitir que administradores vejam todos os comentários
CREATE POLICY post_comments_admin_view_all ON post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários comentem em posts aprovados
CREATE POLICY post_comments_insert_approved ON post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE id = post_comments.post_id
      AND status = 'approved'
    )
  );

-- Política para permitir que usuários editem seus próprios comentários
CREATE POLICY post_comments_update_own ON post_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    NEW.content IS NOT NULL AND
    (OLD.is_deleted = NEW.is_deleted) -- Não permite alterar is_deleted aqui
  );

-- Política para permitir que usuários marquem seus comentários como deletados (soft delete)
CREATE POLICY post_comments_soft_delete_own ON post_comments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    OLD.is_deleted = FALSE AND
    NEW.is_deleted = TRUE AND
    OLD.content = NEW.content -- Não permite alterar conteúdo ao deletar
  );

-- Política para permitir que administradores atualizem qualquer comentário
CREATE POLICY post_comments_admin_update_all ON post_comments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que administradores excluam comentários permanentemente
CREATE POLICY post_comments_admin_delete ON post_comments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 5. Events
```sql
-- Habilitar RLS na tabela events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer usuário veja eventos ativos
CREATE POLICY events_view_active ON events
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Política para permitir que usuários com nível adequado vejam detalhes de eventos
CREATE POLICY events_view_details ON events
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE AND
    (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND advocate_level >= events.required_level
      ) OR
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Política para permitir que apenas administradores criem eventos
CREATE POLICY events_admin_insert ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que apenas administradores atualizem eventos
CREATE POLICY events_admin_update ON events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que apenas administradores excluam eventos
CREATE POLICY events_admin_delete ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 6. Event Registrations
```sql
-- Habilitar RLS na tabela event_registrations
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias inscrições
CREATE POLICY event_registrations_view_own ON event_registrations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para permitir que administradores vejam todas as inscrições
CREATE POLICY event_registrations_admin_view_all ON event_registrations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários se inscrevam em eventos se tiverem o nível adequado
CREATE POLICY event_registrations_insert_own ON event_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events e
      JOIN users u ON u.advocate_level >= e.required_level
      WHERE e.id = event_registrations.event_id AND u.id = auth.uid() AND e.is_active = TRUE
    )
  );

-- Política para permitir que usuários cancelem suas próprias inscrições
CREATE POLICY event_registrations_cancel_own ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    OLD.status IN ('registered', 'confirmed') AND
    NEW.status = 'cancelled'
  );

-- Política para permitir que administradores atualizem qualquer inscrição
CREATE POLICY event_registrations_admin_update_all ON event_registrations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 7. External Submissions
```sql
-- Habilitar RLS na tabela external_submissions
ALTER TABLE external_submissions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias submissões
CREATE POLICY external_submissions_view_own ON external_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para permitir que administradores vejam todas as submissões
CREATE POLICY external_submissions_admin_view_all ON external_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Política para permitir que usuários criem submissões
CREATE POLICY external_submissions_insert_own ON external_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND verification_status = 'pending'
  );

-- Política para permitir que usuários atualizem dados básicos de suas próprias submissões pendentes
CREATE POLICY external_submissions_update_own_pending ON external_submissions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND verification_status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid() AND
    verification_status = 'pending' AND
    OLD.verification_status = NEW.verification_status AND
    (OLD.verified_by IS NULL AND NEW.verified_by IS NULL) AND
    (OLD.verified_at IS NULL AND NEW.verified_at IS NULL) AND
    (OLD.metrics IS NULL AND NEW.metrics IS NULL OR OLD.metrics = NEW.metrics)
  );

-- Política para permitir que administradores atualizem qualquer submissão
CREATE POLICY external_submissions_admin_update_all ON external_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

## Triggers e Funções Auxiliares

```sql
-- Função para atualizar o campo 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas que têm o campo updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_submissions_updated_at
BEFORE UPDATE ON external_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar contador de curtidas nos posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_likes_count_insert
AFTER INSERT ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER trigger_post_likes_count_delete
AFTER DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Trigger para atualizar contador de comentários nos posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se o comentário foi marcado como deletado
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      UPDATE posts SET comments_count = comments_count - 1 WHERE id = NEW.post_id;
    -- Se o comentário foi restaurado
    ELSIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
      UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Apenas diminui o contador se o comentário não estava marcado como deletado
    IF OLD.is_deleted = FALSE THEN
      UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_comments_count_insert
AFTER INSERT ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_post_comments_count_update
AFTER UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER trigger_post_comments_count_delete
AFTER DELETE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();
```

## Funções de Conveniência

```sql
-- Função para contar submissões verificadas de um usuário
-- Pode ser usada para automatizar promoção de níveis de advocate
CREATE OR REPLACE FUNCTION count_verified_submissions(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO submission_count
  FROM external_submissions
  WHERE user_id = user_uuid AND verification_status = 'verified';

  RETURN submission_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter todos os posts de um usuário com comentários aninhados
CREATE OR REPLACE FUNCTION get_user_posts_with_comments(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'content', p.content,
      'media_url', p.media_url,
      'type', p.type,
      'status', p.status,
      'likes_count', p.likes_count,
      'comments_count', p.comments_count,
      'created_at', p.created_at,
      'comments', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'content', c.content,
            'user_id', c.user_id,
            'created_at', c.created_at,
            'user', (
              SELECT jsonb_build_object(
                'full_name', u.full_name,
                'avatar_url', u.avatar_url
              ) FROM users u WHERE u.id = c.user_id
            )
          )
        )
        FROM post_comments c
        WHERE c.post_id = p.id AND NOT c.is_deleted
        ORDER BY c.created_at
      )
    )
  ) INTO result
  FROM posts p
  WHERE p.user_id = user_uuid AND p.status = 'approved'
  ORDER BY p.created_at DESC;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Função para obter feed de posts com informações básicas do autor
CREATE OR REPLACE FUNCTION get_community_feed(limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'content', p.content,
      'media_url', p.media_url,
      'type', p.type,
      'likes_count', p.likes_count,
      'comments_count', p.comments_count,
      'created_at', p.created_at,
      'author', (
        SELECT jsonb_build_object(
          'id', u.id,
          'full_name', u.full_name,
          'avatar_url', u.avatar_url,
          'advocate_level', u.advocate_level
        ) FROM users u WHERE u.id = p.user_id
      )
    )
  ) INTO result
  FROM posts p
  WHERE p.status = 'approved'
  ORDER BY p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;
```

## Índices para Otimização

```sql
-- Índices para tabela users
CREATE INDEX idx_users_advocate_level ON users(advocate_level);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Índices para tabela posts
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_type_status ON posts(type, status);

-- Índices para tabela post_likes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Índices para tabela post_comments
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON post_comments(created_at);
CREATE INDEX idx_post_comments_is_deleted ON post_comments(is_deleted);

-- Índices para tabela events
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_required_level ON events(required_level);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_start_time_is_active ON events(start_time, is_active);

-- Índices para tabela event_registrations
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);

-- Índices para tabela external_submissions
CREATE INDEX idx_external_submissions_user_id ON external_submissions(user_id);
CREATE INDEX idx_external_submissions_platform ON external_submissions(platform);
CREATE INDEX idx_external_submissions_verification_status ON external_submissions(verification_status);
CREATE INDEX idx_external_submissions_submission_date ON external_submissions(submission_date DESC);
CREATE INDEX idx_external_submissions_verification_status_user_id ON external_submissions(verification_status, user_id);
```

## Visões (Views) para Consultas Comuns

```sql
-- View para listar todos os posts aprovados com informações do autor
CREATE OR REPLACE VIEW vw_approved_posts AS
SELECT
  p.*,
  u.full_name AS author_name,
  u.avatar_url AS author_avatar,
  u.advocate_level AS author_level
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'approved'
ORDER BY p.created_at DESC;

-- View para listar eventos ativos futuros
CREATE OR REPLACE VIEW vw_upcoming_events AS
SELECT *
FROM events
WHERE is_active = TRUE AND end_time > NOW()
ORDER BY start_time ASC;

-- View para métricas de engajamento por usuário
CREATE OR REPLACE VIEW vw_user_engagement_metrics AS
SELECT
  u.id,
  u.full_name,
  u.advocate_level,
  COUNT(DISTINCT p.id) AS total_posts,
  SUM(p.likes_count) AS total_likes_received,
  COUNT(DISTINCT pl.post_id) AS total_posts_liked,
  COUNT(DISTINCT pc.id) AS total_comments_made,
  COUNT(DISTINCT es.id) AS total_external_submissions,
  COUNT(DISTINCT CASE WHEN es.verification_status = 'verified' THEN es.id END) AS verified_submissions
FROM users u
LEFT JOIN posts p ON u.id = p.user_id AND p.status = 'approved'
LEFT JOIN post_likes pl ON u.id = pl.user_id
LEFT JOIN post_comments pc ON u.id = pc.user_id AND NOT pc.is_deleted
LEFT JOIN external_submissions es ON u.id = es.user_id
GROUP BY u.id, u.full_name, u.advocate_level;
```

## Próximas Etapas (Pós-MVP)
- Dashboard para métricas de engagement
- Sistema de recompensas e gamificação
- Marketplace de oportunidades para advocates
- Funcionalidades de comunidade (fórum, mensagens)
- Automação para promoção de níveis de advocate baseada em atividade
- Notificações em tempo real com Supabase Realtime
- App mobile para interação no feed e eventos