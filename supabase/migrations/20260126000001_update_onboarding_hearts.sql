-- Migration: Atualizar emails de onboarding para mencionar corações
-- Data: 2026-01-26

-- Email 1: Boas-vindas - agora menciona corações
UPDATE public.site_settings SET value = 'Bem-vindo à {{site_name}}! ❤️🎉' WHERE key = 'email_onboarding1_subject';
UPDATE public.site_settings SET value = 'Sua conta foi criada com sucesso! Agora você faz parte da nossa comunidade e pode começar a ganhar corações ❤️ participando!' WHERE key = 'email_onboarding1_message';
UPDATE public.site_settings SET value = 'Participar de desafios e ganhar corações ❤️,Curtir e comentar posts = mais corações,Seguir membros da comunidade,Trocar corações por prêmios incríveis' WHERE key = 'email_onboarding1_benefits';
UPDATE public.site_settings SET value = 'Quanto mais você participa, mais corações ganha!' WHERE key = 'email_onboarding1_footer';

-- Email 2: Engajamento - foco em corações por ação
UPDATE public.site_settings SET value = '{{name}}, você já ganhou corações hoje? ❤️💪' WHERE key = 'email_onboarding2_subject';
UPDATE public.site_settings SET value = 'Cada interação na comunidade te dá corações ❤️! Curta, comente, crie posts, participe de desafios - tudo conta!' WHERE key = 'email_onboarding2_message';
UPDATE public.site_settings SET value = 'Curtir um post = ❤️,Comentar = ❤️,Criar um post = ❤️,Participar de desafio = ❤️,Seguir alguém = ❤️' WHERE key = 'email_onboarding2_benefits';
UPDATE public.site_settings SET value = 'Cada ação = 1 coração. Simples assim!' WHERE key = 'email_onboarding2_footer';

-- Email 3: Reengajamento - urgência com corações
UPDATE public.site_settings SET value = '{{name}}, seus corações estão esperando! ❤️🎁' WHERE key = 'email_onboarding3_subject';
UPDATE public.site_settings SET value = 'Você sabia que pode trocar seus corações por prêmios incríveis? Não deixe parado, venha engajar e acumular mais!' WHERE key = 'email_onboarding3_message';
UPDATE public.site_settings SET value = 'Prêmios exclusivos por corações,Ranking de quem tem mais corações,Novos desafios toda semana,Comunidade ativa para te apoiar' WHERE key = 'email_onboarding3_benefits';
UPDATE public.site_settings SET value = 'Não perca a chance de ganhar prêmios com seus corações!' WHERE key = 'email_onboarding3_footer';

-- Email de aprovação também
UPDATE public.site_settings SET value = 'Você foi aprovado! ❤️ Venha ganhar corações' WHERE key = 'email_approval_subject';
UPDATE public.site_settings SET value = 'Parabéns! Sua solicitação foi aprovada. Agora você pode criar sua conta e começar a ganhar corações ❤️ participando da comunidade!' WHERE key = 'email_approval_message';
UPDATE public.site_settings SET value = 'Participar de desafios e ganhar ❤️,Curtir e comentar = mais ❤️,Seguir membros da comunidade,Trocar corações por prêmios' WHERE key = 'email_approval_benefits';
