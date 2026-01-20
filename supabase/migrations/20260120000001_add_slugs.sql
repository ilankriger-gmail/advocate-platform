-- Adicionar coluna slug nas tabelas challenges e rewards

-- Challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Rewards  
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Converter para minúsculas, remover acentos, substituir espaços por hífens
  slug := lower(title);
  slug := translate(slug, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn');
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para challenges existentes
UPDATE challenges 
SET slug = generate_slug(title) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Gerar slugs para rewards existentes
UPDATE rewards 
SET slug = generate_slug(name) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL;

-- Criar índices para busca por slug
CREATE INDEX IF NOT EXISTS idx_challenges_slug ON challenges(slug);
CREATE INDEX IF NOT EXISTS idx_rewards_slug ON rewards(slug);
