-- Função para adicionar corações ao usuário
-- Usada pelo sistema de engajamento

CREATE OR REPLACE FUNCTION add_hearts(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET 
    hearts_count = COALESCE(hearts_count, 0) + p_amount,
    updated_at = now()
  WHERE id = p_user_id;
END;
$$;

-- Grant acesso para authenticated users
GRANT EXECUTE ON FUNCTION add_hearts(uuid, integer) TO authenticated;

-- Adicionar coluna hearts_count se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'hearts_count'
  ) THEN
    ALTER TABLE users ADD COLUMN hearts_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Índice para ranking
CREATE INDEX IF NOT EXISTS idx_users_hearts_count ON users(hearts_count DESC);
