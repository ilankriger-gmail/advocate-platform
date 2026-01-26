-- Adicionar número do membro (early adopter badge)
-- Mostra badge para os primeiros 10.000 membros

-- Adicionar coluna member_number
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_number integer;

-- Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_member_number ON users(member_number) WHERE member_number IS NOT NULL;

-- Preencher números baseado na ordem de criação
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as num
  FROM users
)
UPDATE users u
SET member_number = n.num
FROM numbered n
WHERE u.id = n.id AND u.member_number IS NULL;

-- Função para atribuir número ao novo membro
CREATE OR REPLACE FUNCTION assign_member_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Pega o próximo número disponível
  SELECT COALESCE(MAX(member_number), 0) + 1 INTO NEW.member_number FROM users;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS trigger_assign_member_number ON users;
CREATE TRIGGER trigger_assign_member_number
  BEFORE INSERT ON users
  FOR EACH ROW
  WHEN (NEW.member_number IS NULL)
  EXECUTE FUNCTION assign_member_number();
