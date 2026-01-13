-- Seed: Desafios de Atos de Amor
-- Ações especiais para praticar bondade e ganhar recompensas

-- Desafio 1: Ajudar um Idoso
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Ajudar um Idoso',
  'Pratique um ato de bondade ajudando uma pessoa idosa em sua comunidade. Pode ser ajudar a carregar sacolas, atravessar a rua, ou simplesmente fazer companhia.',
  '👴',
  'atos_amor',
  NULL,
  NULL,
  100,
  true,
  'Grave um vídeo mostrando você ajudando uma pessoa idosa. Pode ser:
• Ajudar a carregar compras
• Ajudar a atravessar a rua
• Fazer companhia e conversar
• Ajudar com tarefas domésticas

Poste o vídeo no YouTube e cole o link aqui.',
  true
);

-- Desafio 2: Doar Alimentos
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Doar Alimentos',
  'Faça uma doação de alimentos para pessoas em situação de vulnerabilidade. Pode ser para moradores de rua, instituições de caridade ou famílias necessitadas.',
  '🍞',
  'atos_amor',
  NULL,
  NULL,
  150,
  true,
  'Grave um vídeo mostrando sua doação de alimentos:
• Comprando e entregando alimentos
• Doando para uma instituição
• Ajudando em um projeto social

Mostre o momento da entrega ou doação.',
  true
);

-- Desafio 3: Cuidar de Animais
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Cuidar de Animais de Rua',
  'Demonstre amor aos animais de rua oferecendo comida, água, ou cuidados. Você também pode ajudar ONGs de proteção animal.',
  '🐕',
  'atos_amor',
  NULL,
  NULL,
  80,
  true,
  'Grave um vídeo mostrando você cuidando de animais de rua:
• Dando comida ou água
• Levando ao veterinário
• Ajudando em um abrigo de animais

Mostre seu carinho pelos animais!',
  true
);

-- Desafio 4: Visitar Hospital ou Asilo
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Visitar e Alegrar',
  'Visite um hospital, asilo ou orfanato para levar alegria e conforto às pessoas. Leve um sorriso, uma conversa ou algo especial.',
  '🏥',
  'atos_amor',
  NULL,
  NULL,
  200,
  true,
  'Grave um vídeo da sua visita:
• Conversando com pessoas em hospitais ou asilos
• Levando presentes ou doações
• Fazendo atividades recreativas

Respeite a privacidade e peça permissão.',
  true
);

-- Desafio 5: Plantar uma Árvore
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Plantar uma Árvore',
  'Contribua para o meio ambiente plantando uma árvore ou participando de um projeto de reflorestamento.',
  '🌳',
  'atos_amor',
  NULL,
  NULL,
  120,
  true,
  'Grave um vídeo plantando uma árvore:
• Escolha um local apropriado
• Mostre todo o processo de plantio
• Pode ser em casa, parque ou área de reflorestamento

Cuide do meio ambiente!',
  true
);

-- Desafio 6: Ensinar Algo
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Ensinar Gratuitamente',
  'Compartilhe seu conhecimento ensinando algo a alguém gratuitamente. Pode ser aulas de reforço, um idioma, uma habilidade ou ofício.',
  '📚',
  'atos_amor',
  NULL,
  NULL,
  100,
  true,
  'Grave um vídeo ensinando algo:
• Aulas de reforço escolar
• Ensinando um idioma
• Compartilhando uma habilidade manual
• Ensinando informática para idosos

Mostre a interação com seu aluno!',
  true
);

-- Desafio 7: Limpar um Espaço Público
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Limpar Espaço Público',
  'Faça sua parte para uma cidade mais limpa! Participe da limpeza de uma praça, praia, parque ou outro espaço público.',
  '🧹',
  'atos_amor',
  NULL,
  NULL,
  90,
  true,
  'Grave um vídeo limpando um espaço público:
• Recolhendo lixo em praias ou parques
• Organizando mutirões de limpeza
• Fazendo a diferença no seu bairro

Mostre o antes e depois se possível!',
  true
);

-- Desafio 8: Doar Sangue
INSERT INTO challenges (
  title,
  description,
  icon,
  type,
  goal_type,
  goal_value,
  coins_reward,
  is_active,
  action_instructions,
  requires_video_validation
) VALUES (
  'Doar Sangue',
  'Seja um herói! Doe sangue e ajude a salvar vidas. Uma única doação pode salvar até 4 pessoas.',
  '🩸',
  'atos_amor',
  NULL,
  NULL,
  250,
  true,
  'Grave um vídeo da sua doação de sangue:
• Mostre sua chegada ao hemocentro
• O processo de triagem
• A doação (se permitido)
• Seu certificado de doação

Incentive outros a doar!',
  true
);
