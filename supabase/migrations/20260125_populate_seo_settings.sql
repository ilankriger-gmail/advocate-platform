-- Populate SEO settings with friendly content

-- Home
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_home_title', 'Arena Te Amo | Comunidade Oficial do Moço do Te Amo', 'SEO Home - Título', 'Título da página inicial')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_home_description', 'Faça parte da Arena Te Amo! Participe de desafios, ganhe prêmios exclusivos e conecte-se com milhões de fãs do O Moço do Te Amo.', 'SEO Home - Descrição', 'Descrição da página inicial')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Eventos
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_eventos_title', 'Eventos ao Vivo | Arena Te Amo', 'SEO Eventos - Título', 'Título da página de eventos')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_eventos_description', 'Confira os eventos ao vivo da Arena Te Amo! Lives exclusivas, encontros especiais e muito mais com o Moço do Te Amo.', 'SEO Eventos - Descrição', 'Descrição da página de eventos')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Desafios
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_desafios_title', 'Desafios da Semana | Arena Te Amo', 'SEO Desafios - Título', 'Título da página de desafios')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_desafios_description', 'Participe dos desafios semanais da Arena Te Amo! Complete missões, ganhe pontos e concorra a prêmios incríveis.', 'SEO Desafios - Descrição', 'Descrição da página de desafios')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Ranking
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_ranking_title', 'Ranking de Fãs | Arena Te Amo', 'SEO Ranking - Título', 'Título da página de ranking')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_ranking_description', 'Veja quem são os fãs mais ativos da Arena Te Amo! Ranking semanal e mensal com os maiores pontuadores.', 'SEO Ranking - Descrição', 'Descrição da página de ranking')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Prêmios
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_premios_title', 'Prêmios e Recompensas | Arena Te Amo', 'SEO Prêmios - Título', 'Título da página de prêmios')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_premios_description', 'Troque seus pontos por prêmios exclusivos! Produtos autografados, ingressos VIP e muito mais na Arena Te Amo.', 'SEO Prêmios - Descrição', 'Descrição da página de prêmios')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Login
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_login_title', 'Entrar | Arena Te Amo', 'SEO Login - Título', 'Título da página de login')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_login_description', 'Acesse sua conta na Arena Te Amo e continue participando dos desafios e ganhando prêmios.', 'SEO Login - Descrição', 'Descrição da página de login')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Registro
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_registro_title', 'Criar Conta | Arena Te Amo', 'SEO Registro - Título', 'Título da página de registro')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_registro_description', 'Crie sua conta grátis na Arena Te Amo! Faça parte da maior comunidade de fãs do Moço do Te Amo.', 'SEO Registro - Descrição', 'Descrição da página de registro')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seja Arena (Landing Page)
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_seja_arena_title', 'Seja Arena | Faça Parte da Comunidade Te Amo', 'SEO Seja Arena - Título', 'Título da landing page')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_seja_arena_description', 'Entre para a Arena Te Amo! A comunidade oficial onde você participa, se diverte e ganha prêmios com o Moço do Te Amo.', 'SEO Seja Arena - Descrição', 'Descrição da landing page')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Templates dinâmicos
INSERT INTO site_settings (key, value, label, description) VALUES
('seo_evento_title_template', '{{titulo}} | Evento Arena Te Amo', 'SEO Evento - Template de Título', 'Template do título para páginas de evento')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_evento_description_template', '{{descricao}} Participe ao vivo na Arena Te Amo!', 'SEO Evento - Template de Descrição', 'Template da descrição para páginas de evento')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_desafio_title_template', '{{titulo}} | Desafio Arena Te Amo', 'SEO Desafio - Template de Título', 'Template do título para páginas de desafio')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('seo_desafio_description_template', '{{descricao}} Complete o desafio e ganhe pontos!', 'SEO Desafio - Template de Descrição', 'Template da descrição para páginas de desafio')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Meta title e description gerais (usados como fallback)
INSERT INTO site_settings (key, value, label, description) VALUES
('meta_title', 'Arena Te Amo | Comunidade Oficial do Moço do Te Amo', 'Meta Title Geral', 'Título padrão do site')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, label, description) VALUES
('meta_description', 'A comunidade oficial do Moço do Te Amo. Participe de desafios, ganhe prêmios e faça parte dessa família!', 'Meta Description Geral', 'Descrição padrão do site')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
