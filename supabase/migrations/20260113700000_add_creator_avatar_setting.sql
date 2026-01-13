-- Migration: Adicionar configuração de avatar do criador

INSERT INTO public.site_settings (key, value, description)
VALUES (
  'creator_avatar_url',
  'https://i.imgur.com/JQgKYHx.jpeg',
  'URL da foto de perfil do criador da comunidade'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
