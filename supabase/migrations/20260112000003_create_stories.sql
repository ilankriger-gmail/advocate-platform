-- Migration: Criar tabelas de Stories estilo Instagram
-- Descrição: Stories são posts visuais de criadores/admin exibidos em formato de carrossel no topo do feed

-- ============================================
-- TABELA: stories
-- ============================================
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Conteúdo (mesmo formato de posts)
  media_url TEXT[] NOT NULL,
  media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'carousel')),
  caption TEXT,

  -- Ordenação
  position INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Validação: pelo menos uma mídia
  CONSTRAINT stories_media_not_empty CHECK (array_length(media_url, 1) > 0)
);

-- Comentário na tabela
COMMENT ON TABLE public.stories IS 'Stories estilo Instagram - posts visuais de criadores exibidos no topo do feed';

-- ============================================
-- TABELA: story_views
-- ============================================
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cada usuário vê cada story apenas uma vez
  UNIQUE(story_id, user_id)
);

-- Comentário na tabela
COMMENT ON TABLE public.story_views IS 'Registro de visualizações de stories para controle de "visto/não visto"';

-- ============================================
-- ÍNDICES
-- ============================================

-- Buscar stories de um usuário ordenados por data
CREATE INDEX IF NOT EXISTS idx_stories_user_created
  ON public.stories(user_id, created_at DESC);

-- Listar todos os stories recentes
CREATE INDEX IF NOT EXISTS idx_stories_created
  ON public.stories(created_at DESC);

-- Buscar visualizações de um usuário
CREATE INDEX IF NOT EXISTS idx_story_views_user
  ON public.story_views(user_id, story_id);

-- Buscar quem visualizou um story
CREATE INDEX IF NOT EXISTS idx_story_views_story
  ON public.story_views(story_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: stories
-- ============================================

-- Qualquer pessoa autenticada pode ver stories
CREATE POLICY "stories_select_authenticated" ON public.stories
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas criadores e admins podem criar stories
CREATE POLICY "stories_insert_creators" ON public.stories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND (is_creator = true OR role = 'admin')
    )
  );

-- Apenas o autor pode atualizar seus stories
CREATE POLICY "stories_update_own" ON public.stories
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Apenas o autor ou admin pode deletar stories
CREATE POLICY "stories_delete_own_or_admin" ON public.stories
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- POLÍTICAS: story_views
-- ============================================

-- Usuários podem ver suas próprias visualizações
CREATE POLICY "story_views_select_own" ON public.story_views
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuários podem registrar suas próprias visualizações
CREATE POLICY "story_views_insert_own" ON public.story_views
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar suas próprias visualizações (caso necessário)
CREATE POLICY "story_views_delete_own" ON public.story_views
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================

-- Função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para stories
DROP TRIGGER IF EXISTS stories_updated_at ON public.stories;
CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
