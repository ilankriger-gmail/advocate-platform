-- =====================================================
-- FIX: Recalcular likes_count e comments_count
-- E criar triggers automáticos
-- =====================================================

-- 1. Recalcular likes_count para TODOS os posts
UPDATE posts p
SET likes_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM post_likes
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id;

-- Zerar posts sem likes (que ainda estavam com valor diferente de 0)
UPDATE posts
SET likes_count = 0
WHERE id NOT IN (SELECT DISTINCT post_id FROM post_likes)
AND likes_count != 0;

-- 2. Recalcular comments_count para TODOS os posts
UPDATE posts p
SET comments_count = COALESCE(sub.cnt, 0)
FROM (
  SELECT post_id, COUNT(*) as cnt
  FROM post_comments
  GROUP BY post_id
) sub
WHERE p.id = sub.post_id;

-- Zerar posts sem comments
UPDATE posts
SET comments_count = 0
WHERE id NOT IN (SELECT DISTINCT post_id FROM post_comments)
AND comments_count != 0;

-- 3. Criar trigger para auto-atualizar likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_likes_count ON post_likes;
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- 4. Criar trigger para auto-atualizar comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_comments_count ON post_comments;
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();
