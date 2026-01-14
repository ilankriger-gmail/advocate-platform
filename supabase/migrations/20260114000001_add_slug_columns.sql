-- =============================================
-- MIGRACAO: Adicionar colunas slug para URLs SEO-friendly
-- Permite URLs descritivas como /desafios/nome-do-desafio
-- =============================================

-- Função auxiliar para gerar slug a partir de texto
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          NORMALIZE(text_input, NFD),
          'áàâãäåéèêëíìîïóòôõöúùûüýÿñçÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÝŸÑÇ',
          'aaaaaaeeeeiiiiooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC'
        ),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '(^-|-$)', '', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- CHALLENGES
-- =============================================

-- Adicionar coluna slug
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Criar índice único parcial (permite NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenges_slug
ON challenges(slug) WHERE slug IS NOT NULL;

-- Gerar slugs para registros existentes
-- Adiciona sufixo numérico se houver duplicatas
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INT;
BEGIN
  FOR r IN SELECT id, title FROM challenges WHERE slug IS NULL LOOP
    base_slug := generate_slug(r.title);
    new_slug := base_slug;
    counter := 1;

    -- Verificar duplicatas e adicionar sufixo se necessário
    WHILE EXISTS (SELECT 1 FROM challenges WHERE slug = new_slug AND id != r.id) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE challenges SET slug = new_slug WHERE id = r.id;
  END LOOP;
END $$;

-- =============================================
-- EVENTS (removido - tabela não existe ainda)
-- =============================================

-- =============================================
-- REWARDS
-- =============================================

-- Adicionar coluna slug
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Criar índice único parcial
CREATE UNIQUE INDEX IF NOT EXISTS idx_rewards_slug
ON rewards(slug) WHERE slug IS NOT NULL;

-- Gerar slugs para registros existentes (usa 'name' ao invés de 'title')
DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  new_slug TEXT;
  counter INT;
BEGIN
  FOR r IN SELECT id, name FROM rewards WHERE slug IS NULL LOOP
    base_slug := generate_slug(r.name);
    new_slug := base_slug;
    counter := 1;

    WHILE EXISTS (SELECT 1 FROM rewards WHERE slug = new_slug AND id != r.id) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    UPDATE rewards SET slug = new_slug WHERE id = r.id;
  END LOOP;
END $$;

-- =============================================
-- COMENTARIOS
-- =============================================

COMMENT ON COLUMN challenges.slug IS 'URL slug SEO-friendly gerado a partir do título';
COMMENT ON COLUMN rewards.slug IS 'URL slug SEO-friendly gerado a partir do nome';
COMMENT ON FUNCTION generate_slug(TEXT) IS 'Gera slug URL-friendly a partir de texto, removendo acentos e caracteres especiais';
