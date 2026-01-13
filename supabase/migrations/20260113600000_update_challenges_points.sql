-- Migration: Atualizar Atos de Amor e Pontuação dos Desafios Físicos
--
-- Mudanças:
-- 1. Remover atos de amor existentes
-- 2. Criar 6 novos atos de amor (1000 pontos cada)
-- 3. Atualizar desafios físicos fáceis para 2800 pontos (corda, embaixadinha, polichinelo)
-- 4. Atualizar desafios físicos difíceis para 600 pontos (todos os outros)

-- ============================================
-- PARTE 1: Remover atos de amor existentes
-- ============================================

-- Primeiro, remover participações associadas (se houver)
DELETE FROM challenge_participants
WHERE challenge_id IN (SELECT id FROM challenges WHERE type = 'atos_amor');

-- Remover prêmios associados (se houver)
DELETE FROM challenge_prizes
WHERE challenge_id IN (SELECT id FROM challenges WHERE type = 'atos_amor');

-- Remover os desafios
DELETE FROM challenges WHERE type = 'atos_amor';

-- ============================================
-- PARTE 2: Criar 6 novos Atos de Amor
-- ============================================

INSERT INTO challenges (
  title,
  description,
  type,
  icon,
  coins_reward,
  is_active,
  status,
  requires_video_validation,
  action_instructions,
  created_at,
  updated_at
) VALUES
  (
    'O "Joinha" de Apoio',
    'Faça um "joinha" 👍 e sorria para alguém que esteja trabalhando na rua (gari, guarda, entregador). É quase impossível não retribuírem!',
    'atos_amor',
    '👍',
    1000,
    true,
    'active',
    true,
    'Encontre alguém trabalhando na rua (gari, guarda, entregador) e faça um joinha com um sorriso. Grave a reação!',
    NOW(),
    NOW()
  ),
  (
    'O Tchau para o Ônibus',
    'Acene ("dê tchauzinho") para os passageiros de um ônibus ou transporte escolar passando. A reação em grupo costuma ser ótima!',
    'atos_amor',
    '👋',
    1000,
    true,
    'active',
    true,
    'Quando um ônibus ou transporte escolar passar, acene com entusiasmo para os passageiros. Grave a reação deles!',
    NOW(),
    NOW()
  ),
  (
    'A Reverência na Faixa',
    'Ao atravessar a rua, faça uma reverência teatral ou aceno exagerado de agradecimento para o carro que parou.',
    'atos_amor',
    '🎭',
    1000,
    true,
    'active',
    true,
    'Ao atravessar na faixa de pedestres, agradeça de forma teatral ao motorista que parou. Seja criativo!',
    NOW(),
    NOW()
  ),
  (
    'A Audiência Atenta',
    'Pare e aplauda com entusiasmo um artista de rua (músico, estátua viva).',
    'atos_amor',
    '👏',
    1000,
    true,
    'active',
    true,
    'Encontre um artista de rua e pare para assistir. Aplauda com entusiasmo e grave o momento!',
    NOW(),
    NOW()
  ),
  (
    'O Elogio ao Pet',
    'Aponte para um cachorro passeando e faça um gesto de coração 🫶 ou "joinha" para o dono. Mais seguro que interagir com crianças!',
    'atos_amor',
    '🫶',
    1000,
    true,
    'active',
    true,
    'Ao ver um cachorro passeando, faça um gesto de carinho (coração ou joinha) para o dono. Grave a interação!',
    NOW(),
    NOW()
  ),
  (
    'O "Bom Dia"',
    'Saia na rua dando bom dia para as pessoas. Espalhe energia positiva!',
    'atos_amor',
    '☀️',
    1000,
    true,
    'active',
    true,
    'Saia na rua e dê bom dia para várias pessoas. Grave as reações e o sorriso que você espalha!',
    NOW(),
    NOW()
  );

-- ============================================
-- PARTE 3: Atualizar Desafios Físicos
-- ============================================

-- Tier Fácil: 2800 pontos (corda, embaixadinha, polichinelo)
UPDATE challenges
SET coins_reward = 2800, updated_at = NOW()
WHERE type = 'fisico'
AND (
  LOWER(title) LIKE '%corda%'
  OR LOWER(title) LIKE '%embaixadinha%'
  OR LOWER(title) LIKE '%polichinelo%'
);

-- Tier Difícil: 600 pontos (todos os outros desafios físicos)
UPDATE challenges
SET coins_reward = 600, updated_at = NOW()
WHERE type = 'fisico'
AND LOWER(title) NOT LIKE '%corda%'
AND LOWER(title) NOT LIKE '%embaixadinha%'
AND LOWER(title) NOT LIKE '%polichinelo%';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Mostrar resumo das mudanças
DO $$
DECLARE
  atos_count INTEGER;
  fisico_facil_count INTEGER;
  fisico_dificil_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO atos_count FROM challenges WHERE type = 'atos_amor';
  SELECT COUNT(*) INTO fisico_facil_count FROM challenges WHERE type = 'fisico' AND coins_reward = 2800;
  SELECT COUNT(*) INTO fisico_dificil_count FROM challenges WHERE type = 'fisico' AND coins_reward = 600;

  RAISE NOTICE 'Migration concluída:';
  RAISE NOTICE '- Atos de Amor criados: % (1000 pts cada)', atos_count;
  RAISE NOTICE '- Desafios Físicos Fáceis (2800 pts): %', fisico_facil_count;
  RAISE NOTICE '- Desafios Físicos Difíceis (600 pts): %', fisico_dificil_count;
END $$;
