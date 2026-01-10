-- Correção de acentuação nos templates de email

-- Email 1 (Aprovação)
UPDATE site_settings SET value = 'Você foi aprovado para o {{site_name}}!' WHERE key = 'email_approval_subject';
UPDATE site_settings SET value = 'Olá {{name}}!' WHERE key = 'email_approval_greeting';
UPDATE site_settings SET value = 'Temos uma ótima notícia! Sua solicitação para fazer parte da comunidade foi APROVADA!' WHERE key = 'email_approval_message';
UPDATE site_settings SET value = 'Desafios exclusivos,Eventos especiais,Prêmios incríveis,Conteúdos exclusivos' WHERE key = 'email_approval_benefits';
UPDATE site_settings SET value = 'Te esperamos lá!' WHERE key = 'email_approval_footer';

-- Email 2 (Follow-up)
UPDATE site_settings SET value = 'Ainda dá tempo de entrar no {{site_name}}!' WHERE key = 'email_followup_subject';
UPDATE site_settings SET value = 'Olá {{name}}!' WHERE key = 'email_followup_greeting';
UPDATE site_settings SET value = 'Percebemos que você ainda não criou sua conta na nossa comunidade. Essa é sua última chance de garantir acesso a conteúdos exclusivos, desafios e prêmios incríveis!' WHERE key = 'email_followup_message';
UPDATE site_settings SET value = 'Conteúdos exclusivos do criador,Desafios com prêmios reais,Comunidade engajada,Acesso antecipado a novidades' WHERE key = 'email_followup_benefits';
UPDATE site_settings SET value = 'Não perca essa oportunidade única!' WHERE key = 'email_followup_footer';
