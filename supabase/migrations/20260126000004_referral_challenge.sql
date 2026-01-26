-- Migration: Desafio de Indicação
-- Criar desafio permanente para incentivar indicações

INSERT INTO public.challenges (
  title,
  description,
  type,
  status,
  coins_reward,
  start_date,
  end_date,
  is_recurring,
  max_participants,
  image_url
) VALUES (
  '🎁 Indique Amigos e Ganhe 100 ❤️',
  E'Convide seus amigos para a Arena Te Amo!\n\n**Como funciona:**\n• Compartilhe seu código de indicação\n• Quando seu amigo criar a conta, vocês dois ganham 100 corações!\n• E tem mais: você ganha bônus em cascata!\n\n**Recompensas em cascata:**\n• Indicação direta: 100 ❤️\n• 2ª geração: 50 ❤️\n• 3ª geração: 25 ❤️\n• 4ª geração: 12 ❤️\n• 5ª geração: 6 ❤️\n• 6ª geração: 3 ❤️\n\nQuanto mais você indica, mais você ganha! ❤️‍🔥',
  'social',
  'active',
  100,
  NOW(),
  NOW() + INTERVAL '10 years', -- Desafio permanente
  true,
  NULL, -- Sem limite de participantes
  NULL
)
ON CONFLICT DO NOTHING;

-- Criar achievement para top indicadores
INSERT INTO public.challenges (
  title,
  description,
  type,
  status,
  coins_reward,
  start_date,
  end_date,
  is_recurring,
  max_participants
) VALUES 
(
  '👥 Indicador Bronze: 5 Amigos',
  'Indique 5 amigos que criem conta na plataforma. Recompensa: 50 corações extras!',
  'social',
  'active',
  50,
  NOW(),
  NOW() + INTERVAL '10 years',
  false,
  NULL
),
(
  '👥 Indicador Prata: 10 Amigos', 
  'Indique 10 amigos que criem conta na plataforma. Recompensa: 150 corações extras!',
  'social',
  'active',
  150,
  NOW(),
  NOW() + INTERVAL '10 years',
  false,
  NULL
),
(
  '👥 Indicador Ouro: 25 Amigos',
  'Indique 25 amigos que criem conta na plataforma. Recompensa: 500 corações extras!',
  'social',
  'active',
  500,
  NOW(),
  NOW() + INTERVAL '10 years',
  false,
  NULL
),
(
  '👥 Indicador Diamante: 50 Amigos',
  'Indique 50 amigos que criem conta na plataforma. Recompensa: 1500 corações + badge exclusivo!',
  'social',
  'active',
  1500,
  NOW(),
  NOW() + INTERVAL '10 years',
  false,
  NULL
)
ON CONFLICT DO NOTHING;
