-- Migration: Adicionar tracking de origem do cadastro
-- Permite saber de qual landing page cada usuário veio

-- ============================================
-- Adicionar campos de origem no profiles
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS signup_source TEXT,
ADD COLUMN IF NOT EXISTS signup_source_id UUID,
ADD COLUMN IF NOT EXISTS signup_source_name TEXT;

-- Índice para queries de relatório
CREATE INDEX IF NOT EXISTS idx_profiles_signup_source ON public.profiles(signup_source) WHERE signup_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_signup_source_id ON public.profiles(signup_source_id) WHERE signup_source_id IS NOT NULL;

-- ============================================
-- View para estatísticas de landing pages
-- ============================================
CREATE OR REPLACE VIEW public.landing_page_stats AS
SELECT 
  p.signup_source,
  p.signup_source_id,
  p.signup_source_name,
  COUNT(*) as total_signups,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '24 hours') as signups_24h,
  COUNT(*) FILTER (WHERE p.created_at >= NOW() - INTERVAL '7 days') as signups_7d,
  MIN(p.created_at) as first_signup,
  MAX(p.created_at) as last_signup
FROM public.profiles p
WHERE p.signup_source IS NOT NULL
GROUP BY p.signup_source, p.signup_source_id, p.signup_source_name
ORDER BY total_signups DESC;

-- ============================================
-- Função RPC para atualizar source do usuário
-- (chamada do callback de auth)
-- ============================================
CREATE OR REPLACE FUNCTION public.set_user_signup_source(
  p_user_id UUID,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL,
  p_source_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    signup_source = p_source,
    signup_source_id = p_source_id,
    signup_source_name = p_source_name
  WHERE id = p_user_id
    AND signup_source IS NULL; -- Só atualiza se ainda não tiver source (primeiro login)
END;
$$;

-- Permissão para service role
GRANT EXECUTE ON FUNCTION public.set_user_signup_source TO service_role;

-- ============================================
-- Comentários
-- ============================================
COMMENT ON COLUMN public.profiles.signup_source IS 'Tipo de origem: landing_challenge, landing_reward, direct, etc';
COMMENT ON COLUMN public.profiles.signup_source_id IS 'ID do desafio/prêmio de origem (se aplicável)';
COMMENT ON COLUMN public.profiles.signup_source_name IS 'Nome da landing page de origem (para relatórios)';
COMMENT ON VIEW public.landing_page_stats IS 'Estatísticas de inscritos por landing page';
