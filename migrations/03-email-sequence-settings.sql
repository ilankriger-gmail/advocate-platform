INSERT INTO site_settings (key, value, label, description, field_type) VALUES
('email_followup_subject', 'Ainda da tempo de entrar no {{site_name}}!', 'Assunto Email 2', 'Assunto do segundo email de follow-up', 'text'),
('email_followup_greeting', 'Ola {{name}}!', 'Saudacao Email 2', 'Saudacao do email de follow-up', 'text'),
('email_followup_message', 'Percebemos que voce ainda nao criou sua conta na nossa comunidade. Essa e sua ultima chance de garantir acesso a conteudos exclusivos, desafios e premios incriveis!', 'Mensagem Email 2', 'Corpo do email de follow-up', 'textarea'),
('email_followup_benefits', 'Conteudos exclusivos do criador,Desafios com premios reais,Comunidade engajada,Acesso antecipado a novidades', 'Beneficios Email 2', 'Lista de beneficios separados por virgula', 'textarea'),
('email_followup_cta', 'Criar Minha Conta Agora', 'Botao Email 2', 'Texto do botao CTA do follow-up', 'text'),
('email_followup_footer', 'Nao perca essa oportunidade unica!', 'Rodape Email 2', 'Texto do rodape do follow-up', 'text')
ON CONFLICT (key) DO NOTHING;
