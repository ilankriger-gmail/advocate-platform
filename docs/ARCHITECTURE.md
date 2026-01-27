# Arquitetura - Arena Te Amo (advocate-platform)

> Última atualização: 2025-07-20

## Visão Geral

Plataforma de comunidade gamificada para fãs do criador "Moço do Te Amo". Combina feed social, desafios com validação por IA, sistema de corações (moeda virtual), ranking, prêmios, eventos e um painel admin completo.

**URL Produção:** https://comunidade.omocodoteamo.com.br  
**Landing Page:** https://comece.omocodoteamo.com.br (rewrite para /seja-arena)

---

## Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15.5 (App Router) |
| UI | React 19 + TailwindCSS 3.4 |
| Rich Text | TipTap 3 |
| Charts | Recharts 3.6 |
| Animações | Framer Motion 12 |
| Auth/DB/Storage | Supabase (PostgreSQL + Auth + Storage) |
| IA - Vídeo | Google Gemini (análise de vídeo YouTube) |
| IA - Texto | OpenAI GPT-4o mini (autoresponder, descrições, análise leads) |
| IA - Moderação | Perspective API (toxicidade) + Sightengine (imagens) |
| Email | Resend |
| WhatsApp | Meta Cloud API (via Twilio fallback) |
| Rate Limiting | Upstash Redis |
| Deploy | Vercel |
| Testes | Jest + Playwright |

---

## Estrutura de Diretórios

```
advocate-platform/
├── src/
│   ├── app/                    # App Router (páginas e rotas)
│   │   ├── (auth)/             # Grupo: registro
│   │   ├── (dashboard)/        # Grupo: área logada
│   │   │   ├── admin/          # Painel admin (21 seções)
│   │   │   ├── dashboard/      # Dashboard do usuário
│   │   │   ├── desafios/       # Lista de desafios
│   │   │   ├── descobrir/      # Descobrir usuários
│   │   │   ├── eventos/        # Eventos
│   │   │   ├── feed/           # Feed + criar post
│   │   │   ├── perfil/         # Perfil do usuário
│   │   │   ├── post/[id]/      # Post individual
│   │   │   ├── premios/        # Loja de prêmios
│   │   │   ├── profile/        # Perfil público
│   │   │   ├── ranking/        # Leaderboard
│   │   │   └── debug/          # Debug (dev)
│   │   ├── (marketing)/        # Grupo: páginas públicas
│   │   │   ├── convite/        # Convite por referral
│   │   │   ├── lp/             # Landing pages dinâmicas
│   │   │   ├── privacidade/    # Política de privacidade
│   │   │   ├── seja-arena/     # NPS + cadastro
│   │   │   └── termos/         # Termos de uso
│   │   ├── api/
│   │   │   ├── admin/          # APIs admin (integrations, scrape-url)
│   │   │   ├── cron/           # Cron jobs (process-tasks, ranking-snapshot)
│   │   │   ├── linkdobem/      # Integração LinkDoBem
│   │   │   └── webhooks/       # Webhooks (WhatsApp, Resend)
│   │   ├── auth/               # Auth callbacks + reset password
│   │   ├── esqueci-senha/      # Esqueci senha
│   │   ├── login/              # Login
│   │   └── suporte/            # Página de suporte
│   ├── actions/                # Server Actions (43 arquivos)
│   ├── components/             # Componentes React
│   │   ├── admin/              # Componentes admin
│   │   ├── ads/                # Banners de anúncio
│   │   ├── analytics/          # Google Analytics
│   │   ├── auth/               # Login/Registro
│   │   ├── challenges/         # Desafios
│   │   ├── editor/             # Rich Text Editor
│   │   ├── events/             # Eventos
│   │   ├── home/               # Feed/Home
│   │   ├── landing/            # Landing pages
│   │   ├── layout/             # Header/Sidebar/BottomNav
│   │   ├── leaderboard/        # Ranking
│   │   ├── notifications/      # Notificações
│   │   ├── onboarding/         # Onboarding modal
│   │   ├── posts/              # Cards de post
│   │   ├── profile/            # Avatar uploader
│   │   ├── ranking/            # Lista ranking
│   │   ├── seo/                # JSON-LD
│   │   ├── social/             # Follow button, sugestões
│   │   ├── stories/            # Stories (parcialmente desabilitado)
│   │   ├── ui/                 # Design system (25 componentes)
│   │   └── youtube/            # YouTube video picker
│   ├── contexts/               # React Contexts
│   ├── lib/                    # Bibliotecas/Utils
│   │   ├── ai/                 # IA (analyze-lead, generate-description, thumbnails, verify-link)
│   │   ├── analytics/          # Queries e utils de analytics
│   │   ├── config/             # Site config
│   │   ├── linkdobem/          # Integração LinkDoBem
│   │   ├── moderation/         # Engine de moderação (imagem + texto + help detection)
│   │   ├── notifications/      # Email + WhatsApp + Scheduler
│   │   ├── security/           # Audit log, CSRF, file validation, rate limit, retry
│   │   ├── supabase/           # Clientes Supabase (server, client, admin, middleware)
│   │   └── validation/         # Validações (NPS, etc.)
│   └── types/                  # TypeScript types
├── apps/mobile/                # App Expo (planejado)
├── public/                     # Assets estáticos
├── docs/                       # Documentação
└── supabase/                   # Migrations/config
```

---

## Fluxo de Autenticação

1. **Login:** `/login` → Supabase Auth (email/password)
2. **Registro:** `/registro` (ou via NPS `/seja-arena`)
3. **Middleware:** `src/middleware.ts` → `updateSession()` (refresh tokens em todas as rotas)
4. **Auth Helpers:**
   - `requireAuth()` → Verifica autenticação
   - `requireAdmin()` → Verifica se é admin
   - `requireAdminOrCreator()` → Verifica admin OU creator
5. **Admin Guard:** `AdminAuthCheck` component no layout do admin

---

## Rotas e Páginas

### Públicas
| Rota | Descrição |
|------|-----------|
| `/login` | Login |
| `/registro` | Registro |
| `/esqueci-senha` | Reset de senha |
| `/auth/reset-password` | Formulário de nova senha |
| `/auth/callback` | Callback OAuth |
| `/seja-arena` | Landing NPS (formulário de cadastro) |
| `/seja-arena/obrigado` | Pós-cadastro NPS |
| `/lp/[type]/[id]` | Landing pages dinâmicas (challenge/reward) |
| `/convite/[type]/[id]` | Convite por referral |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |
| `/suporte` | Página de suporte |

### Dashboard (autenticado)
| Rota | Descrição |
|------|-----------|
| `/` (root) | Home/Feed |
| `/dashboard` | Dashboard do usuário |
| `/feed` | Feed + criar post |
| `/feed/edit` | Editar post |
| `/post/[id]` | Post individual |
| `/desafios` | Lista de desafios |
| `/eventos` | Lista de eventos |
| `/eventos/[id]` | Detalhe do evento |
| `/premios` | Loja de prêmios |
| `/ranking` | Leaderboard |
| `/perfil` | Meu perfil |
| `/perfil/editar` | Editar perfil |
| `/perfil/salvos` | Posts salvos |
| `/perfil/novo-post` | Criar post |
| `/perfil/posts/[id]/editar` | Editar post |
| `/profile/[id]` | Perfil público |
| `/profile/edit` | Editar perfil (alt) |
| `/descobrir` | Descobrir usuários |
| `/debug` | Debug (dev) |

### Admin (21 seções)
| Rota | Descrição |
|------|-----------|
| `/admin` | Dashboard admin (stats) |
| `/admin/posts` | Moderação de posts |
| `/admin/comentarios` | Moderação de comentários |
| `/admin/desafios` | Gestão de desafios |
| `/admin/desafios/novo` | Criar desafio |
| `/admin/desafios/[id]` | Detalhe do desafio |
| `/admin/desafios/[id]/editar` | Editar desafio |
| `/admin/eventos` | Gestão de eventos |
| `/admin/eventos/novo` | Criar evento |
| `/admin/eventos/[id]/editar` | Editar evento |
| `/admin/premios` | Gestão de prêmios |
| `/admin/premios/[id]/editar` | Editar prêmio |
| `/admin/resgates` | Gestão de resgates |
| `/admin/usuarios` | Gestão de usuários |
| `/admin/usuarios/[id]` | Detalhe do usuário |
| `/admin/coracoes` | Economia de corações |
| `/admin/leads` | Gestão de leads NPS |
| `/admin/emails` | Email templates |
| `/admin/broadcast` | Envio de broadcast |
| `/admin/notificacoes` | Sistema de notificações |
| `/admin/landing-pages` | Landing pages |
| `/admin/engajamento` | Métricas de engajamento |
| `/admin/seguidores` | Seguidores |
| `/admin/analytics` | Analytics avançado |
| `/admin/anuncios` | Anúncios (LinkDoBem) |
| `/admin/bugs` | Relatórios de bugs |
| `/admin/configuracoes` | Configurações do site |
| `/admin/_stories` | Stories (desabilitado) |

---

## Server Actions (43 arquivos)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `feed.ts` | Feed com paginação cursor, sorts (new/top/hot/comments), filtro similaridade |
| `posts.ts` | CRUD posts, aprovação, rejeição, feature, moderação |
| `comments-admin.ts` | Moderação de comentários |
| `challenges.ts` | Participação em desafios, validação IA (Gemini) |
| `challenges-admin.ts` | CRUD desafios, gerenciar participações, winners |
| `events.ts` | Listagem e registro em eventos |
| `events-admin.ts` | CRUD eventos |
| `rewards.ts` | Listagem e resgate de prêmios |
| `rewards-admin.ts` | CRUD prêmios |
| `leaderboard.ts` | Ranking por categoria/período |
| `social.ts` | Follow/unfollow, perfis, sugestões |
| `referrals.ts` | Sistema de indicação em cascata (6 gerações) |
| `notifications.ts` | Notificações in-app |
| `broadcast.ts` | Envio de email em massa |
| `broadcast-admin.ts` | Admin de broadcast |
| `autoresponder.ts` | Auto-resposta IA do "Moço" |
| `leads.ts` | Gestão de leads NPS |
| `landing-pages.ts` | Dados para landing pages |
| `landing-stats.ts` | Estatísticas de landing pages |
| `analytics.ts` | Analytics avançado |
| `engagement.ts` | Métricas de engajamento |
| `love.ts` | Sistema de níveis de amor (5 níveis de like) |
| `saves.ts` | Salvar posts |
| `search.ts` | Busca |
| `auth.ts` | Ações de autenticação |
| `profile.ts` | Perfil do usuário |
| `onboarding.ts` | Progresso do onboarding |
| `settings.ts` | Configurações do site |
| `stats.ts` | Estatísticas gerais |
| `feedback.ts` | Feedback/bug reports |
| `slugs.ts` | Geração de slugs |
| `stories.ts` | CRUD stories |
| `stories-admin.ts` | Admin stories |
| `shop-import.ts` | Importar prêmios de loja externa |
| `export-users.ts` | Exportar usuários |
| `youtube.ts` | Busca vídeos YouTube |
| `ai.ts` | Geração IA (descrições, thumbnails) |

---

## APIs e Cron Jobs

### API Routes
| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/admin/integrations` | GET | Verificar status das integrações |
| `/api/admin/scrape-url` | POST | Scrape URL para importar dados |
| `/api/cron/process-tasks` | GET | Processar tarefas agendadas (cada 15min) |
| `/api/cron/ranking-snapshot` | GET | Snapshot diário do ranking |
| `/api/linkdobem/campaigns` | GET | Listar campanhas LinkDoBem |
| `/api/linkdobem/sync` | POST | Sincronizar dados LinkDoBem |
| `/api/webhooks/whatsapp` | POST | Webhook Meta WhatsApp |
| `/api/webhooks/resend` | POST | Webhook Resend (email tracking) |

### Cron Jobs (Vercel)
| Job | Schedule | Descrição |
|-----|----------|-----------|
| `process-tasks` | `*/15 * * * *` | Processa notificações, autoresponder, email sequences |
| `ranking-snapshot` | `0 0 * * *` | Snapshot diário do leaderboard |

---

## Integrações Externas

| Serviço | Uso | Config |
|---------|-----|--------|
| **Supabase** | Auth, PostgreSQL, Storage, Realtime | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Google Gemini** | Análise de vídeos YouTube (desafios) | `gemini_api_key` (site_settings) |
| **OpenAI GPT-4o mini** | Autoresponder, descrições, análise de leads | `openai_api_key` (site_settings) + `OPENAI_API_KEY` |
| **Resend** | Email transacional e broadcast | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| **Meta Cloud API** | WhatsApp notifications | `whatsapp_*` (site_settings) |
| **Perspective API** | Análise de toxicidade | `perspective_api_key` (site_settings) |
| **YouTube Data API** | Busca vídeos | `youtube_api_key` (site_settings) |
| **Upstash Redis** | Rate limiting | `@upstash/redis` |
| **Google Analytics** | Tracking | `NEXT_PUBLIC_GA_MEASUREMENT_ID` |
| **LinkDoBem** | Anúncios solidários | API dedicada |

---

## Segurança

- **Auth:** Supabase Auth com session refresh via middleware
- **RLS:** Policies no PostgreSQL (nível de tabela)
- **CSP:** Content Security Policy restritiva
- **HSTS:** Strict Transport Security
- **CSRF:** Proteção CSRF
- **Rate Limiting:** Upstash Redis + limites por ação
- **Anti-Spam:** Bans progressivos (24h → 1 mês)
- **Moderação:** IA automática (Perspective API + Sightengine)
- **Sanitização:** DOMPurify para HTML
- **File Validation:** Validação de tipo/tamanho de arquivo
- **Audit Log:** Log de ações administrativas
- **Headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy
