-- Migration: Adicionar 15 novos Atos de Amor
-- Mesma pontuação (1000 pontos) e mais diversidade

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
  created_at
) VALUES
  -- 1. O Elevador Alegre
  (
    'O Elevador Alegre',
    'Transforme a viagem de elevador em um momento especial! Cumprimente com entusiasmo as pessoas que entrarem no elevador com você. Um simples "Boa tarde!" pode quebrar o silêncio constrangedor e alegrar o dia de alguém!

Para participar, é simples:

1. Entre em um elevador (do prédio, shopping, hospital, etc.)
2. Cumprimente cada pessoa que entrar com um "Olá!", "Bom dia!" ou similar
3. Grave um vídeo mostrando você cumprimentando as pessoas
4. Capture as reações e sorrisos que você provoca
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Seja simpático e natural! Um sorriso ajuda muito.',
    'atos_amor',
    '🛗',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo cumprimentando pessoas no elevador com entusiasmo. Mostre as reações!',
    NOW()
  ),

  -- 2. A Gorjeta Surpresa
  (
    'A Gorjeta Surpresa',
    'Surpreenda alguém com uma gorjeta inesperada! Dê uma gorjeta generosa para um garçom, entregador, cabeleireiro ou qualquer profissional de serviço. A surpresa e gratidão no rosto deles é impagável!

Para participar, é simples:

1. Vá a um restaurante, peça um delivery ou use qualquer serviço
2. Dê uma gorjeta acima do esperado (pode ser 50%, 100% ou mais!)
3. Grave um vídeo do momento da entrega da gorjeta
4. Capture a reação de surpresa e gratidão
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: O valor não precisa ser alto - o que importa é a intenção e a surpresa!',
    'atos_amor',
    '💰',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo dando uma gorjeta surpresa generosa para alguém. Mostre a reação de gratidão!',
    NOW()
  ),

  -- 3. O Carrinho Devolvido
  (
    'O Carrinho Devolvido',
    'Ajude a próxima pessoa! Ao terminar suas compras no mercado, ofereça seu carrinho para alguém que está chegando em vez de simplesmente devolvê-lo. É um pequeno gesto que facilita a vida do próximo!

Para participar, é simples:

1. Termine suas compras no supermercado
2. Em vez de devolver o carrinho, procure alguém chegando
3. Ofereça seu carrinho com um sorriso
4. Grave um vídeo mostrando a interação
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Funciona muito bem em dias de chuva ou quando o estacionamento está cheio!',
    'atos_amor',
    '🛒',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo oferecendo seu carrinho de supermercado para alguém chegando. Mostre a reação!',
    NOW()
  ),

  -- 4. O Segura Porta
  (
    'O Segura Porta',
    'Um clássico que nunca sai de moda! Segure a porta para alguém que vem logo atrás de você. Mas aqui o desafio é ir além: espere mais do que o normal e segure para várias pessoas passarem!

Para participar, é simples:

1. Ao passar por uma porta (loja, prédio, metrô, etc.)
2. Segure a porta e espere pessoas passarem
3. Aguarde mais do que o normal - deixe 3, 4 ou mais pessoas passarem!
4. Grave um vídeo mostrando você segurando a porta
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Faça contato visual e sorria para cada pessoa que passar!',
    'atos_amor',
    '🚪',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo segurando a porta para várias pessoas passarem. Mostre as reações de agradecimento!',
    NOW()
  ),

  -- 5. O Café Solidário
  (
    'O Café Solidário',
    'Espalhe energia positiva pagando o café de um desconhecido! Pode ser na padaria, cafeteria ou lanchonete. Pague o pedido da pessoa da fila atrás de você ou do próximo cliente!

Para participar, é simples:

1. Vá a uma cafeteria, padaria ou lanchonete
2. Faça seu pedido normalmente
3. Pague também o pedido da próxima pessoa (ou de alguém na fila)
4. Grave um vídeo do momento
5. Capture a reação de surpresa da pessoa
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Pode ser um café, lanche ou até mesmo o almoço de alguém!',
    'atos_amor',
    '☕',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo pagando o café/lanche de um desconhecido. Mostre a reação de surpresa!',
    NOW()
  ),

  -- 6. O Elogio Sincero
  (
    'O Elogio Sincero',
    'Todos merecem ouvir algo bom! Faça um elogio sincero para um desconhecido. Pode ser sobre a roupa, cabelo, sorriso, energia ou qualquer coisa que você genuinamente admire!

Para participar, é simples:

1. Observe as pessoas ao seu redor
2. Encontre algo genuíno para elogiar (roupa, estilo, sorriso, etc.)
3. Aproxime-se com educação e faça o elogio sincero
4. Grave um vídeo mostrando a interação
5. Capture a reação da pessoa (geralmente ficam muito felizes!)
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Seja específico! "Adorei sua bolsa!" é melhor que um elogio genérico.',
    'atos_amor',
    '💬',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo fazendo um elogio sincero para um desconhecido. Mostre a reação!',
    NOW()
  ),

  -- 7. A Ajuda com Sacolas
  (
    'A Ajuda com Sacolas',
    'Seja as mãos extras que alguém precisa! Ofereça ajuda para carregar sacolas de quem está sobrecarregado. Pode ser na rua, no mercado, no ônibus ou em qualquer lugar!

Para participar, é simples:

1. Observe ao redor e encontre alguém carregando muitas sacolas
2. Ofereça ajuda de forma educada
3. Ajude a carregar até o destino (carro, porta, ponto de ônibus)
4. Grave um vídeo mostrando você ajudando
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Idosos e mães com crianças costumam precisar mais de ajuda!',
    'atos_amor',
    '🛍️',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo oferecendo e ajudando alguém a carregar sacolas. Mostre a gratidão!',
    NOW()
  ),

  -- 8. O Bilhete Positivo
  (
    'O Bilhete Positivo',
    'Deixe mensagens de amor pelo caminho! Escreva bilhetes com mensagens positivas e deixe em locais públicos para pessoas encontrarem. Pode ser no banco da praça, livro da biblioteca, espelho do banheiro...

Para participar, é simples:

1. Escreva bilhetes com mensagens positivas e motivacionais
2. Escolha locais públicos para deixá-los
3. Grave um vídeo deixando os bilhetes em diferentes lugares
4. Mostre as mensagens que você escreveu
5. Poste seu vídeo no YouTube ou Instagram
6. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Mensagens como "Você é incrível!", "Hoje vai dar tudo certo!" ou "Alguém torce por você!" funcionam muito bem!',
    'atos_amor',
    '📝',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo deixando bilhetes positivos em locais públicos. Mostre as mensagens!',
    NOW()
  ),

  -- 9. O Copo d''Água
  (
    'O Copo d''Água',
    'Refresque quem trabalha no sol! Ofereça água gelada para alguém trabalhando sob o sol - pode ser o gari, o entregador, o vendedor ambulante, o pedreiro ou qualquer trabalhador.

Para participar, é simples:

1. Prepare uma garrafa de água gelada
2. Encontre alguém trabalhando no sol
3. Ofereça a água com um sorriso
4. Grave um vídeo do momento
5. Capture a reação de gratidão
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Em dias muito quentes, esse gesto é ainda mais valioso!',
    'atos_amor',
    '💧',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo oferecendo água gelada para alguém trabalhando no sol. Mostre a reação!',
    NOW()
  ),

  -- 10. O Aplauso ao Idoso
  (
    'O Aplauso ao Idoso',
    'Celebre quem nos inspira! Ao ver um idoso fazendo exercício, caminhando ou se esforçando, aplauda e dê palavras de incentivo. Eles merecem todo o reconhecimento!

Para participar, é simples:

1. Vá a uma praça, parque ou academia
2. Encontre um idoso se exercitando ou caminhando
3. Aplauda e dê palavras de incentivo sinceras
4. Grave um vídeo mostrando a interação
5. Capture a reação (geralmente ficam muito emocionados!)
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Frases como "Parabéns pela dedicação!" ou "O senhor é uma inspiração!" funcionam muito bem!',
    'atos_amor',
    '👴',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo aplaudindo e incentivando um idoso se exercitando. Mostre a reação!',
    NOW()
  ),

  -- 11. A Prioridade Cedida
  (
    'A Prioridade Cedida',
    'Gentileza gera gentileza! Ceda seu lugar na fila ou seu assento no transporte público para alguém - não apenas para quem tem prioridade legal, mas para qualquer pessoa que pareça precisar.

Para participar, é simples:

1. Ao estar em uma fila ou sentado no transporte público
2. Observe se alguém poderia se beneficiar da sua prioridade
3. Ofereça seu lugar com educação e um sorriso
4. Grave um vídeo do momento
5. Capture a reação de gratidão
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Não precisa ser só para grávidas ou idosos - qualquer pessoa cansada ou sobrecarregada merece!',
    'atos_amor',
    '💺',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo cedendo seu lugar (fila ou assento) para alguém. Mostre a reação!',
    NOW()
  ),

  -- 12. O Agradecimento ao Motorista
  (
    'O Agradecimento ao Motorista',
    'Reconheça quem nos leva! Ao descer do ônibus, van ou Uber, agradeça ao motorista de forma especial - com um aperto de mão, um "muito obrigado" olhando nos olhos ou até um pequeno mimo!

Para participar, é simples:

1. Use um transporte público ou aplicativo
2. Ao descer, vá até o motorista
3. Agradeça de forma especial (aperto de mão, olhar nos olhos, palavras sinceras)
4. Grave um vídeo do momento
5. Capture a reação do motorista
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Motoristas raramente recebem agradecimentos - sua gratidão pode fazer o dia deles!',
    'atos_amor',
    '🚌',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo agradecendo especialmente o motorista ao descer. Mostre a reação!',
    NOW()
  ),

  -- 13. O Presente ao Porteiro
  (
    'O Presente ao Porteiro',
    'Valorize quem cuida de você! Dê um presente simples para o porteiro, zelador ou funcionário do prédio. Pode ser um chocolate, um café especial ou qualquer lembrancinha!

Para participar, é simples:

1. Compre um presente simples (chocolate, café, etc.)
2. Vá até o porteiro ou zelador do prédio
3. Entregue o presente com palavras de agradecimento
4. Grave um vídeo do momento
5. Capture a reação de surpresa e gratidão
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Mencione algo específico que você aprecia no trabalho deles!',
    'atos_amor',
    '🎁',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo entregando um presente ao porteiro/zelador. Mostre a reação!',
    NOW()
  ),

  -- 14. A Flor para Desconhecida
  (
    'A Flor para Desconhecida',
    'Espalhe beleza pelo mundo! Compre uma flor (ou um pequeno buquê) e dê para uma pessoa desconhecida na rua. Pode ser uma idosa, uma moça ou qualquer pessoa que você sinta que merece esse carinho!

Para participar, é simples:

1. Compre uma flor ou pequeno buquê
2. Caminhe pela rua observando as pessoas
3. Escolha alguém para presentear (use sua intuição!)
4. Entregue a flor com um sorriso e palavras gentis
5. Grave um vídeo do momento
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Idosas geralmente ficam muito emocionadas com esse gesto!',
    'atos_amor',
    '🌸',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo dando uma flor para uma pessoa desconhecida na rua. Mostre a reação!',
    NOW()
  ),

  -- 15. O High Five Aleatório
  (
    'O High Five Aleatório',
    'Espalhe energia com um toque! Saia na rua oferecendo "high fives" (toca aqui) para pessoas aleatórias. É impossível não sorrir depois de um high five!

Para participar, é simples:

1. Saia para uma caminhada em local movimentado
2. Levante a mão oferecendo high five para as pessoas
3. Diga "Toca aqui!" com entusiasmo
4. Grave um vídeo com várias pessoas diferentes
5. Capture os sorrisos e reações
6. Poste seu vídeo no YouTube ou Instagram
7. Envie o link do seu post aqui na plataforma para validar sua participação

DICA: Quanto mais entusiasmo, mais pessoas vão querer participar!',
    'atos_amor',
    '🖐️',
    1000,
    true,
    'active',
    true,
    'Grave um vídeo dando high fives aleatórios para pessoas na rua. Mostre os sorrisos!',
    NOW()
  );

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  new_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_count
  FROM challenges
  WHERE type = 'atos_amor'
  AND title IN (
    'O Elevador Alegre',
    'A Gorjeta Surpresa',
    'O Carrinho Devolvido',
    'O Segura Porta',
    'O Café Solidário',
    'O Elogio Sincero',
    'A Ajuda com Sacolas',
    'O Bilhete Positivo',
    'O Copo d''Água',
    'O Aplauso ao Idoso',
    'A Prioridade Cedida',
    'O Agradecimento ao Motorista',
    'O Presente ao Porteiro',
    'A Flor para Desconhecida',
    'O High Five Aleatório'
  );

  SELECT COUNT(*) INTO total_count FROM challenges WHERE type = 'atos_amor';

  RAISE NOTICE 'Migration concluída:';
  RAISE NOTICE '- Novos Atos de Amor criados: %', new_count;
  RAISE NOTICE '- Total de Atos de Amor: %', total_count;
END $$;
