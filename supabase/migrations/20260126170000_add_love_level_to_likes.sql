-- Migration: Adicionar love_level aos likes
-- Feature: Likes diferenciados com níveis de amor

-- Adicionar coluna love_level na tabela post_likes
ALTER TABLE post_likes 
ADD COLUMN IF NOT EXISTS love_level INTEGER DEFAULT 2;

-- Níveis de amor:
-- 1 = Curti (🤍) - básico
-- 2 = Te Amo (❤️) - padrão
-- 3 = Te Amo Muito (❤️‍🔥) - intenso
-- 4 = Super Te Amo (💝) - especial
-- 5 = Te Amo Real (👑) - máximo

-- Índice para buscar por nível
CREATE INDEX IF NOT EXISTS idx_post_likes_love_level 
ON post_likes(love_level);

-- Comentário na coluna
COMMENT ON COLUMN post_likes.love_level IS 'Nível de amor do like (1-5)';
