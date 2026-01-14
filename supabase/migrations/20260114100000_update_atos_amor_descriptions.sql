-- Migration: Atualizar descrições dos Atos de Amor
-- Seguindo a mesma estrutura detalhada dos desafios físicos

-- ============================================
-- ATUALIZAR DESCRIÇÕES DOS ATOS DE AMOR
-- ============================================

-- 1. O "Joinha" de Apoio
UPDATE challenges
SET
  description = 'Espalhe positividade para quem trabalha duro nas ruas! Faça um "joinha" 👍 e sorria para alguém que esteja trabalhando (gari, guarda, entregador). É quase impossível não retribuírem!

Para participar, é simples:

1. Encontre alguém trabalhando na rua (gari, guarda, entregador, etc.)
2. Grave um vídeo fazendo um "joinha" 👍 com um sorriso genuíno para a pessoa
3. Capture a reação da pessoa (geralmente eles retribuem!)
4. Poste seu vídeo no YouTube ou Instagram
5. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Seja natural e espontâneo! O importante é transmitir gratidão e reconhecimento.',
  action_instructions = 'Grave um vídeo fazendo um "joinha" 👍 com sorriso para alguém trabalhando na rua (gari, guarda, entregador). Mostre a reação da pessoa!'
WHERE title = 'O "Joinha" de Apoio' AND type = 'atos_amor';

-- 2. O Tchau para o Ônibus
UPDATE challenges
SET
  description = 'Surpreenda passageiros com um tchauzinho amigável! Acene para os passageiros de um ônibus ou transporte escolar passando. A reação em grupo costuma ser incrível!

Para participar, é simples:

1. Posicione-se em um local seguro onde ônibus ou transporte escolar passam
2. Quando o veículo passar, acene com entusiasmo para os passageiros
3. Grave um vídeo mostrando você acenando e a reação dos passageiros
4. Poste seu vídeo no YouTube ou Instagram
5. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Transporte escolar costuma ter reações mais animadas! Crianças adoram acenar de volta.',
  action_instructions = 'Grave um vídeo acenando ("dando tchauzinho") com entusiasmo para passageiros de um ônibus ou transporte escolar. Mostre a reação deles!'
WHERE title = 'O Tchau para o Ônibus' AND type = 'atos_amor';

-- 3. A Reverência na Faixa
UPDATE challenges
SET
  description = 'Transforme o simples ato de atravessar a rua em um momento de alegria! Faça uma reverência teatral ou aceno exagerado de agradecimento para o carro que parou na faixa.

Para participar, é simples:

1. Vá até uma faixa de pedestres movimentada
2. Espere um carro parar para você atravessar
3. Grave um vídeo fazendo uma reverência teatral ou aceno exagerado de agradecimento
4. Seja criativo e divertido! Pode ser uma reverência de rei/rainha, um aceno de celebridade, etc.
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Quanto mais teatral e divertido, melhor! Motoristas adoram esse tipo de interação positiva.',
  action_instructions = 'Grave um vídeo atravessando na faixa de pedestres e fazendo uma reverência teatral ou aceno exagerado de agradecimento ao motorista que parou.'
WHERE title = 'A Reverência na Faixa' AND type = 'atos_amor';

-- 4. A Audiência Atenta
UPDATE challenges
SET
  description = 'Valorize a arte de rua! Pare e aplauda com entusiasmo um artista de rua (músico, estátua viva, malabarista). Seu reconhecimento faz toda a diferença!

Para participar, é simples:

1. Encontre um artista de rua (músico, estátua viva, malabarista, etc.)
2. Pare para assistir a apresentação por alguns momentos
3. Grave um vídeo aplaudindo com entusiasmo ao final
4. Se possível, interaja brevemente com o artista
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Artistas de rua vivem do reconhecimento do público. Seu aplauso genuíno pode fazer o dia deles!',
  action_instructions = 'Grave um vídeo parando para assistir um artista de rua (músico, estátua viva, etc.) e aplaudindo com entusiasmo ao final.'
WHERE title = 'A Audiência Atenta' AND type = 'atos_amor';

-- 5. O Elogio ao Pet
UPDATE challenges
SET
  description = 'Espalhe amor para os pets e seus donos! Ao ver um cachorro passeando, faça um gesto de coração 🫶 ou "joinha" para o dono. É mais seguro e tão fofo quanto interagir direto com o pet!

Para participar, é simples:

1. Encontre alguém passeando com um cachorro na rua
2. Aponte para o pet com carinho
3. Faça um gesto de coração 🫶 ou "joinha" 👍 para o dono
4. Grave um vídeo mostrando a interação e a reação do dono
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Donos de pets adoram quando elogiam seus "filhos de 4 patas"! A reação costuma ser muito positiva.',
  action_instructions = 'Grave um vídeo apontando para um cachorro passeando e fazendo um gesto de coração 🫶 ou "joinha" 👍 para o dono. Mostre a reação!'
WHERE title = 'O Elogio ao Pet' AND type = 'atos_amor';

-- 6. O "Bom Dia"
UPDATE challenges
SET
  description = 'Comece uma onda de positividade! Saia na rua dando bom dia para as pessoas. Um simples "bom dia" pode transformar o dia de alguém!

Para participar, é simples:

1. Saia para um passeio na rua, praça ou parque
2. Cumprimente as pessoas que encontrar com um "Bom dia!" alegre
3. Grave um vídeo mostrando você cumprimentando várias pessoas
4. Capture as reações e sorrisos que você espalha
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Seja genuíno e mantenha um sorriso! Quanto mais natural, melhores serão as reações.',
  action_instructions = 'Grave um vídeo saindo na rua e dando "Bom dia!" para várias pessoas. Mostre as reações e sorrisos que você espalha!'
WHERE title = 'O "Bom Dia"' AND type = 'atos_amor';

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM challenges
  WHERE type = 'atos_amor'
  AND description LIKE '%Para participar, é simples%';

  RAISE NOTICE 'Atos de Amor atualizados com descrições detalhadas: %', updated_count;
END $$;
