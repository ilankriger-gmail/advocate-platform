# Features - Arena Te Amo

> Última atualização: 2025-07-20

## Resumo de Status

| Status | Significado |
|--------|-------------|
| ✅ Ativo | Funcionando em produção |
| ⚡ Ativo (parcial) | Funciona, mas com limitações |
| 🔧 Implementado | Código existe, mas pouco usado |
| ⏸️ Desabilitado | Código existe, mas desligado |
| 📋 Planejado | Ainda não implementado |

---

## 1. Sistema de Posts e Feed

**Status:** ✅ Ativo | **Posts:** 95 | **Likes:** 214 | **Comentários:** 296

### Funcionalidades
- Feed infinito com paginação por cursor
- 4 tipos de ordenação: Novos, Top (likes), Hot, Comentários
- 5 filtros de feed: Criador, Comunidade, Todos, Pedidos de Ajuda, Seguindo
- Posts com texto rico (TipTap), imagens (carrossel), YouTube embed, Instagram embed
- Like com 5 níveis de amor (Curti → Te Amo Real) com custos em corações
- Comentários com replies (threaded)
- Salvar posts (344 saves)
- Compartilhar posts (68 shares)
- Sistema de votos (447 votes)
- Filtro de posts similares (Jaccard 50%) por mesmo usuário
- Detecção automática de pedidos de ajuda

### Moderação
- **Automática:** Perspective API (toxicidade) + Sightengine (imagens)
- **3 decisões:** approved, pending_review, blocked
- **Thresholds configuráveis** via site_settings
- Posts de criador: aprovação automática
- Posts de comunidade: passam por moderação
- Admin: aprovar/rejeitar/bloquear com motivo

### Arquivos
- `actions/feed.ts`, `actions/posts.ts`, `actions/love.ts`, `actions/saves.ts`
- `lib/moderation/`, `lib/similarity.ts`
- `components/posts/`, `components/home/`

---

## 2. Desafios (Challenges)

**Status:** ✅ Ativo | **Desafios:** 57 | **Participações:** 12

### Tipos de Desafio
1. **Físico:** Repetições ou tempo, prova por vídeo YouTube
2. **Engajamento:** Interação no Instagram do criador
3. **Participe:** Ações específicas na comunidade
4. **Atos de Amor:** Desafios de bondade

### Validação por IA
- **Google Gemini:** Assiste vídeos YouTube e conta repetições/mede tempo
- **OpenAI:** Verifica links do Instagram (hashtag, tag de perfil)
- **Flag de suspeito:** Conteúdo duvidoso marcado para revisão humana
- **Confiança:** Score 0-100% na análise

### Prêmios
- Prêmios em dinheiro (PIX) ou corações
- Sistema de vencedores com prova de pagamento
- Múltiplos prêmios por desafio

### Admin
- CRUD completo de desafios
- Aprovar/rejeitar participações
- Geração de descrição por IA (OpenAI)
- Geração de thumbnails por IA
- Toggle ativo/inativo
- Visualização por tipo ou lista unificada

### Arquivos
- `actions/challenges.ts`, `actions/challenges-admin.ts`
- `lib/gemini.ts`, `lib/ai/verify-link.ts`, `lib/ai/generate-description.ts`
- `components/challenges/`

---

## 3. Sistema de Corações (Moeda Virtual)

**Status:** ✅ Ativo | **Usuários com saldo:** 887 | **Transações:** 313

### Como ganhar
- **1 ação = 1 coração** (flat, sem variação)
- 30+ ações diferentes: criar post, curtir, comentar, seguir, completar perfil, etc.
- Desafios: recompensa configurável por desafio
- Referral: cascata de até 6 gerações (100/50/25/12/6/3 corações)

### Como gastar
- Likes premium (níveis 3-5): custo de 5/20/100 corações
- Resgate de prêmios na loja

### Anti-Spam
- Limites por hora e por dia por tipo de ação
- Bans progressivos: 24h → 48h → 72h → 1 semana → 2 semanas → 1 mês

### Arquivos
- `lib/hearts.ts`, `lib/hearts-config.ts`, `lib/love-levels.ts`, `lib/spam-protection.ts`
- `actions/love.ts`

---

## 4. Ranking / Leaderboard

**Status:** ✅ Ativo

### Categorias
- **Corações:** Ranking por saldo de corações
- **Desafios:** Ranking por desafios completados
- **Combinado:** Score combinado

### Períodos
- Semanal, Mensal, All-time

### Tiers
- 🥉 Bronze | 🥈 Silver | 🥇 Gold | 💎 Diamond

### Features
- Ranking relativo (mostra posição do usuário)
- Widget de preview no feed
- Snapshot diário via cron job

### Arquivos
- `actions/leaderboard.ts`
- `lib/supabase/leaderboard.ts`
- `components/leaderboard/`

---

## 5. Eventos

**Status:** ✅ Ativo

### Funcionalidades
- Eventos presenciais e virtuais
- Registro com status (registered → confirmed → attended → cancelled)
- Limite de participantes
- Nível mínimo requerido
- Meeting URL para eventos virtuais
- Imagem de capa
- Slug para SEO

### Admin
- CRUD completo
- Gerenciar registros
- Filtrar por status

### Arquivos
- `actions/events.ts`, `actions/events-admin.ts`
- `lib/supabase/events.ts`
- `components/events/`

---

## 6. Prêmios e Resgates

**Status:** ✅ Ativo | **Prêmios:** 18 | **Resgates:** 2

### Funcionalidades
- Loja de prêmios com custo em corações
- Filtros por disponibilidade
- Imagem com zoom
- Status de resgate: pending → approved → shipped → delivered → cancelled
- Importação de loja externa

### Admin
- CRUD de prêmios
- Gerenciar resgates
- Upload de imagens
- Importar de loja (scrape URL)

### Arquivos
- `actions/rewards.ts`, `actions/rewards-admin.ts`, `actions/shop-import.ts`
- `lib/supabase/rewards.ts`
- `components/premios/`

---

## 7. Broadcast de Email

**Status:** 🔧 Implementado (0 broadcasts enviados)

### Funcionalidades
- Envio em massa para todos os usuários
- Templates com título, mensagem, CTA
- Filtro por audiência
- Envio em lotes de 10
- Tracking de envio (via Resend)

### Arquivos
- `actions/broadcast.ts`, `actions/broadcast-admin.ts`

---

## 8. Sistema de Referral / Indicação

**Status:** 🔧 Implementado

### Funcionalidades
- Código de indicação único por usuário
- Recompensas em cascata (6 gerações):
  - Gen 1 (indicador): 100 ❤️
  - Gen 1 (indicado): 100 ❤️
  - Gen 2: 50 ❤️
  - Gen 3: 25 ❤️
  - Gen 4: 12 ❤️
  - Gen 5: 6 ❤️
  - Gen 6: 3 ❤️
- Landing page de convite `/convite/[type]/[id]`
- Card de referral nos desafios

### Arquivos
- `actions/referrals.ts`
- `components/challenges/ReferralCard.tsx`

---

## 9. Autoresponder (Moço do Te Amo)

**Status:** ✅ Ativo (configurado)

### Funcionalidades
- Responde automaticamente como "Moço do Te Amo" a comentários
- GPT-4o mini gera resposta contextualizada
- 67% de probabilidade de responder
- Delay aleatório: 3 min a 2 horas
- Processado pelo cron job (a cada 15min)
- Não responde a si mesmo

### Configuração
- `MOCO_USER_ID`: f6001534-96d1-496a-9953-ff7f3946a611
- `OPENAI_API_KEY`: via site_settings ou .env

### Arquivos
- `actions/autoresponder.ts`
- `lib/autoresponder.ts`

---

## 10. Filtro de Similaridade

**Status:** ✅ Ativo

### Funcionalidades
- Jaccard similarity com threshold de 50%
- Remove stop words (PT-BR + EN)
- Filtra apenas duplicatas do MESMO usuário
- Também detecta imagens duplicadas (mesmo URL)
- Mantém post mais antigo, remove duplicatas

### Arquivos
- `lib/similarity.ts`
- Aplicado em `actions/feed.ts`

---

## 11. Stories

**Status:** ⏸️ Desabilitado | **Stories:** 3 | **Views:** 3

### Funcionalidades (existentes no código)
- Criar stories com imagem/texto
- Barra de stories no topo do feed
- Visualizador com progresso
- Link para conteúdo (post, desafio, evento)
- Admin de stories

### Notas
- Mencionado como "TEMPORARIAMENTE DESABILITADO" no admin dashboard
- Rota `/admin/_stories` (prefixo `_` indica desabilitado)

### Arquivos
- `actions/stories.ts`, `actions/stories-admin.ts`
- `components/stories/`

---

## 12. Leads NPS

**Status:** ✅ Ativo | **Leads:** 351

### Funcionalidades
- Formulário NPS em `/seja-arena` (score 0-10 + motivo + dados)
- Análise por IA (OpenAI): score, sentimento, recomendação, resumo
- Auto-aprovação configurável (por score mínimo)
- Importação CSV
- Filtros avançados
- Sequência de emails automatizada (3 emails + WhatsApp fallback)
- Tracking de conversão (lead → usuário)
- Consentimento LGPD

### Sequência de Notificações
1. Email de aprovação (imediato)
2. Verificação se email foi aberto (cron)
3. Email 2 (follow-up se não abriu)
4. WhatsApp final (último recurso)

### Admin
- Listar, filtrar, aprovar/rejeitar leads
- Análise por IA
- Bulk approve por score
- Auto-approval settings
- Importação CSV

### Arquivos
- `actions/leads.ts`
- `lib/ai/analyze-lead.ts`
- `lib/notifications/`
- `lib/validation/nps-validation.ts`

---

## 13. Landing Pages

**Status:** ✅ Ativo

### Funcionalidades
- Landing pages dinâmicas para desafios: `/lp/challenge/[id]`
- Landing pages dinâmicas para prêmios: `/lp/reward/[id]`
- Countdown timer
- Urgency badge
- Fade-in animations
- Product image zoom
- SEO otimizado
- Tracking de source (em NPS leads)

### Admin
- Estatísticas de signups por landing page
- Lista de LPs por tipo

### Arquivos
- `actions/landing-pages.ts`, `actions/landing-stats.ts`
- `app/(marketing)/lp/[type]/[id]/page.tsx`
- `components/landing/`

---

## 14. Follow / Seguidores

**Status:** ✅ Ativo | **Follows:** 774

### Funcionalidades
- Follow/unfollow usuários
- Feed "Seguindo" (posts de quem você segue)
- Perfil público com contadores
- Sugestões de usuários
- Página "Descobrir"
- Notificação ao ser seguido
- Corações por follow

### Arquivos
- `actions/social.ts`
- `components/social/`

---

## 15. Notificações

**Status:** ⚡ Ativo (parcial) | **Notificações in-app:** 7

### Tipos
- post_approved, post_rejected
- new_comment, new_like, new_follower
- challenge_approved, challenge_rejected, challenge_winner
- reward_claimed, reward_shipped, reward_delivered
- event_reminder, event_updated
- coins_earned, level_up, system

### Canais
- **In-app:** Dropdown de notificações
- **Email:** Via Resend
- **WhatsApp:** Via Meta Cloud API

### Arquivos
- `actions/notifications.ts`
- `lib/notifications/`
- `components/notifications/`

---

## 16. Analytics

**Status:** ✅ Ativo

### Dashboard Admin
- Overview cards (users, active, posts, challenges)
- Trend charts (crescimento temporal)
- Engagement funnel
- User segments
- Cohort heatmap
- Activity breakdown
- Retention chart
- Export de dados
- Seletor de período (7d/30d/90d)

### Google Analytics
- Integração via `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Arquivos
- `actions/analytics.ts`, `actions/engagement.ts`, `actions/stats.ts`
- `lib/analytics/`
- `app/(dashboard)/admin/analytics/`

---

## 17. Admin Panel

**Status:** ✅ Ativo | **21 seções**

### Seções
1. **Dashboard** - Stats gerais com cards
2. **Posts** - Moderação de posts
3. **Comentários** - Moderação de comentários
4. **Desafios** - CRUD + participações + winners
5. **Eventos** - CRUD eventos
6. **Prêmios** - CRUD prêmios
7. **Resgates** - Gerenciar resgates
8. **Usuários** - Listar, detalhar, editar
9. **Corações** - Economia de corações
10. **Leads** - Gestão de leads NPS
11. **Emails** - Templates de email
12. **Broadcast** - Envio em massa
13. **Notificações** - Status de notificações
14. **Landing Pages** - Stats de LPs
15. **Engajamento** - Métricas
16. **Seguidores** - Dados de follows
17. **Analytics** - Dashboard analítico
18. **Anúncios** - LinkDoBem + campanhas
19. **Bugs** - Relatórios de bugs
20. **Configurações** - Site settings (Geral, SEO, Imagens, Integrações)
21. **Stories** - Admin de stories (desabilitado)

---

## 18. Onboarding

**Status:** ✅ Ativo | **Completados:** 832

### Funcionalidades
- Modal de boas-vindas para novos usuários
- Steps guiados
- Tracking de progresso
- Wrapper no dashboard layout

### Arquivos
- `actions/onboarding.ts`
- `components/onboarding/`

---

## 19. SEO

**Status:** ✅ Ativo

### Funcionalidades
- JSON-LD structured data
- Sitemap dinâmico
- Robots.txt
- Meta tags configuráveis via site_settings
- Open Graph tags
- Templates de SEO por página

### Arquivos
- `components/seo/JsonLd.tsx`
- `app/sitemap.ts`, `app/robots.ts`

---

## 20. PWA / Mobile

**Status:** 📋 Planejado

### Existente
- `app/manifest.ts` - Web App Manifest
- `apps/mobile/` - Expo app (estrutura básica)
- `AppComingSoonBanner` - Banner informando que app está chegando

### Pendente
- App nativo funcional
- Push notifications
- Offline support

---

## 21. Anúncios / LinkDoBem

**Status:** 🔧 Implementado (0 campanhas)

### Funcionalidades
- Integração com LinkDoBem (anúncios solidários)
- Banner de anúncios no feed
- Campanhas com sync
- Admin: listar, criar, sincronizar

### Arquivos
- `api/linkdobem/`
- `lib/linkdobem/sync.ts`
- `components/ads/AdBanner.tsx`
- `components/home/LinkDoBemSection.tsx`, `LinkDoBemInline.tsx`

---

## 22. Segurança

**Status:** ✅ Ativo

### Funcionalidades
- Rate limiting (Upstash Redis)
- CSRF protection
- File validation (tipo, tamanho)
- Audit logging
- Retry com backoff
- Input validation/sanitization (DOMPurify)
- Password strength indicator
- CSP headers
- HSTS
- Anti-spam com bans progressivos

### Arquivos
- `lib/security/`
- `lib/sanitize.ts`
- `lib/password-validation.ts`
- `lib/spam-protection.ts`
