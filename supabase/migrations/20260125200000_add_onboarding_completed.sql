-- Migration: Adicionar campo onboarding_completed na tabela users
-- Descrição: Flag para controlar se o usuário já completou o onboarding

-- Adicionar coluna onboarding_completed com valor padrão false
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Criar índice para consultas rápidas de usuários que não completaram onboarding
CREATE INDEX IF NOT EXISTS idx_users_onboarding_incomplete
ON users(id)
WHERE onboarding_completed = false;

-- Comentário na coluna
COMMENT ON COLUMN users.onboarding_completed IS 'Indica se o usuário já completou o fluxo de onboarding inicial';
