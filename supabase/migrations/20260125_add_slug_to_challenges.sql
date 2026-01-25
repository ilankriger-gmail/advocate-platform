-- Adicionar coluna slug para URLs amigáveis
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS slug TEXT;

-- Criar índice único para slug
CREATE UNIQUE INDEX IF NOT EXISTS challenges_slug_key ON challenges(slug) WHERE slug IS NOT NULL;

-- Função para gerar slug a partir do título
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Converter para minúsculas
  slug := LOWER(title);
  
  -- Substituir caracteres especiais portugueses
  slug := REPLACE(slug, 'á', 'a');
  slug := REPLACE(slug, 'à', 'a');
  slug := REPLACE(slug, 'ã', 'a');
  slug := REPLACE(slug, 'â', 'a');
  slug := REPLACE(slug, 'é', 'e');
  slug := REPLACE(slug, 'ê', 'e');
  slug := REPLACE(slug, 'í', 'i');
  slug := REPLACE(slug, 'ó', 'o');
  slug := REPLACE(slug, 'ô', 'o');
  slug := REPLACE(slug, 'õ', 'o');
  slug := REPLACE(slug, 'ú', 'u');
  slug := REPLACE(slug, 'ü', 'u');
  slug := REPLACE(slug, 'ç', 'c');
  
  -- Remover aspas e caracteres especiais
  slug := REGEXP_REPLACE(slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Substituir espaços por hífens
  slug := REGEXP_REPLACE(slug, '\s+', '-', 'g');
  
  -- Remover hífens duplicados
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
  
  -- Remover hífens no início e fim
  slug := TRIM(BOTH '-' FROM slug);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para todos os desafios existentes
UPDATE challenges 
SET slug = generate_slug(title) || '-' || SUBSTRING(id::TEXT, 1, 8)
WHERE slug IS NULL;

-- Verificar resultado
SELECT id, title, slug FROM challenges ORDER BY title LIMIT 10;
