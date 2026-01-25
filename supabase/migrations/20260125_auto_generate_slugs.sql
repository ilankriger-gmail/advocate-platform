-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Converter para minúsculas, remover acentos e caracteres especiais
  slug := lower(unaccent(name));
  -- Substituir espaços e caracteres especiais por hífen
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  -- Remover hífens do início e fim
  slug := trim(both '-' from slug);
  -- Limitar tamanho
  slug := substring(slug from 1 for 200);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para gerar slug automaticamente em rewards
CREATE OR REPLACE FUNCTION trigger_generate_reward_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Só gera se slug estiver vazio
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.name);
    new_slug := base_slug;
    
    -- Verificar duplicatas e adicionar sufixo se necessário
    WHILE EXISTS (SELECT 1 FROM rewards WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS rewards_generate_slug ON rewards;
CREATE TRIGGER rewards_generate_slug
  BEFORE INSERT OR UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_reward_slug();

-- Trigger para gerar slug automaticamente em challenges
CREATE OR REPLACE FUNCTION trigger_generate_challenge_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Só gera se slug estiver vazio
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.title);
    new_slug := base_slug;
    
    -- Verificar duplicatas e adicionar sufixo se necessário
    WHILE EXISTS (SELECT 1 FROM challenges WHERE slug = new_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      new_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS challenges_generate_slug ON challenges;
CREATE TRIGGER challenges_generate_slug
  BEFORE INSERT OR UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_challenge_slug();

-- Gerar slugs para registros existentes que não têm
UPDATE rewards 
SET slug = generate_slug(name) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL OR slug = '';

UPDATE challenges 
SET slug = generate_slug(title) || '-' || substring(id::text from 1 for 8)
WHERE slug IS NULL OR slug = '';
