-- Migration: Criar 5 posts de boas-vindas do criador
-- Estes posts explicam como a plataforma funciona para novos usuários

DO $$
DECLARE
  creator_id UUID;
BEGIN
  -- Buscar o primeiro usuário criador
  SELECT id INTO creator_id
  FROM public.users
  WHERE is_creator = true
  LIMIT 1;

  -- Se não encontrar criador, não fazer nada
  IF creator_id IS NULL THEN
    RAISE NOTICE 'Nenhum criador encontrado. Posts de boas-vindas não criados.';
    RETURN;
  END IF;

  RAISE NOTICE 'Criando posts de boas-vindas com criador: %', creator_id;

  -- Post 1: Bem-vindo à Comunidade
  INSERT INTO public.posts (
    user_id, title, content, type, status, media_type, is_featured, created_at
  ) VALUES (
    creator_id,
    'Bem-vindo à Comunidade! 🎉',
    'Que alegria ter você aqui! Esta é a nossa comunidade exclusiva onde você pode:

✨ Participar de desafios e ganhar moedas
💪 Completar exercícios físicos diários
🎁 Trocar suas moedas por prêmios incríveis
👥 Conectar com pessoas que pensam como você

Explore o app, participe dos desafios e divirta-se! Qualquer dúvida, é só perguntar aqui na comunidade.',
    'creator',
    'approved',
    'none',
    true,
    NOW() - INTERVAL '5 days'
  ) ON CONFLICT DO NOTHING;

  -- Post 2: Como Ganhar Moedas
  INSERT INTO public.posts (
    user_id, title, content, type, status, media_type, is_featured, created_at
  ) VALUES (
    creator_id,
    'Como Ganhar Moedas 🪙',
    'Quer saber como acumular moedas para trocar por prêmios? É simples!

💰 FORMAS DE GANHAR MOEDAS:

1️⃣ Desafios Físicos - Complete exercícios como flexões, abdominais, agachamentos
2️⃣ Desafios de Engajamento - Curta, comente e compartilhe nas redes sociais
3️⃣ Sorteios - Participe de sorteios especiais
4️⃣ Atividade na Comunidade - Faça posts e interaja com outros membros

📊 DICA: Acesse a aba "Desafios" para ver todos os desafios disponíveis e quantas moedas cada um vale!

Quanto mais você participa, mais moedas acumula. Vamos lá! 💪',
    'creator',
    'approved',
    'none',
    true,
    NOW() - INTERVAL '4 days'
  ) ON CONFLICT DO NOTHING;

  -- Post 3: Desafios
  INSERT INTO public.posts (
    user_id, title, content, type, status, media_type, is_featured, created_at
  ) VALUES (
    creator_id,
    'Desafios: Seu Caminho para Prêmios 🏆',
    'Os desafios são a melhor forma de ganhar moedas! Veja como funcionam:

🏋️ DESAFIOS FÍSICOS
- Faça exercícios como flexões, abdominais, prancha
- Grave um vídeo ou tire foto fazendo o exercício
- Envie para validação e ganhe suas moedas!

📱 DESAFIOS DE ENGAJAMENTO
- Curta posts nas redes sociais
- Comente em vídeos
- Compartilhe conteúdos
- Tire print e envie como comprovação

🎁 SORTEIOS (PARTICIPE)
- Cumpra as regras do sorteio
- Quanto mais participa, mais chances de ganhar!

⏰ IMPORTANTE: Cada desafio tem prazo! Fique de olho nas datas para não perder nenhum.',
    'creator',
    'approved',
    'none',
    true,
    NOW() - INTERVAL '3 days'
  ) ON CONFLICT DO NOTHING;

  -- Post 4: Comunidade
  INSERT INTO public.posts (
    user_id, title, content, type, status, media_type, is_featured, created_at
  ) VALUES (
    creator_id,
    'Comunidade: Compartilhe e Conecte 👥',
    'A comunidade é o coração da plataforma! Aqui você pode:

💬 FAZER POSTS
- Compartilhe seu progresso nos desafios
- Conte suas conquistas
- Faça perguntas para a comunidade

❤️ INTERAGIR
- Curta posts de outros membros
- Deixe comentários de apoio
- Salve posts que você gostou

🆘 PEDIR AJUDA
- Precisa de uma mãozinha? Use a opção "Pedir Ajuda"
- A comunidade está aqui para te apoiar

📸 COMPARTILHAR MÍDIA
- Poste fotos e vídeos
- Mostre seus resultados
- Inspire outros membros!

Lembre-se: respeito é fundamental. Vamos construir juntos uma comunidade positiva! 🙌',
    'creator',
    'approved',
    'none',
    true,
    NOW() - INTERVAL '2 days'
  ) ON CONFLICT DO NOTHING;

  -- Post 5: Prêmios
  INSERT INTO public.posts (
    user_id, title, content, type, status, media_type, is_featured, created_at
  ) VALUES (
    creator_id,
    'Resgate seus Prêmios 🎁',
    'Acumulou moedas? Hora de trocar por prêmios incríveis!

🛍️ COMO RESGATAR:
1. Acesse a aba "Prêmios"
2. Veja os prêmios disponíveis e quantas moedas cada um custa
3. Escolha o prêmio que deseja
4. Clique em "Resgatar"
5. Aguarde o contato para entrega!

💡 DICAS:
- Fique de olho nos prêmios limitados
- Alguns prêmios são exclusivos por tempo limitado
- Continue participando dos desafios para acumular mais moedas

🏆 RANKING:
- Acompanhe sua posição no ranking geral
- Os maiores pontuadores ganham prêmios especiais!

Bora acumular moedas e resgatar prêmios? 🚀',
    'creator',
    'approved',
    'none',
    true,
    NOW() - INTERVAL '1 day'
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Posts de boas-vindas criados com sucesso!';
END $$;
