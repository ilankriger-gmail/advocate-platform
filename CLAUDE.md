# Regras do Projeto - Plataforma de Advocate Marketing

> Plataforma de marketing de advogados de marca (Arena Te Amo / O Moço do Te Amo) que conecta marcas com defensores para criar desafios, organizar eventos, compartilhar conteúdo e recompensar engajamento.

## Tech Stack

- **Framework**: Next.js 15 (App Router) com React 19
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estilização**: Tailwind CSS 3.4
- **Linguagem**: TypeScript 5.3 (strict mode)
- **Gerenciamento de Estado**: TanStack Query (servidor), React Context (UI)
- **Validação**: Zod
- **Editor Rico**: TipTap
- **Email**: Resend
- **WhatsApp**: Twilio + Meta Business API
- **IA**: Google Gemini (análise de leads, descrições, moderação)
- **Rate Limiting**: Upstash Redis
- **Testes**: Playwright (E2E), Jest + Testing Library (unitários)
- **Deploy**: Vercel

## Comandos

```bash
# Desenvolvimento
npm run dev              # servidor de desenvolvimento local
npm run build            # build de produção
npm run lint             # ESLint
npm run typecheck        # verificação de tipos TypeScript
npm run verify           # lint + typecheck + build (verificação completa)

# Testes
npm run test:e2e         # rodar testes Playwright
npm run test:e2e:ui      # Playwright com UI
npm run test:e2e:debug   # Playwright debug
npm run test:e2e:headed  # Playwright com navegador visível

# Supabase
npx supabase gen types typescript --local > lib/database.types.ts  # gerar tipos
npx supabase db push     # aplicar migrations

# Utilitários
npm run check-env        # verificar variáveis de ambiente
```

## Estrutura de Diretórios

```
src/
├── app/                        # Next.js 15 App Router
│   ├── (auth)/                 # Rotas de autenticação (login, registro)
│   ├── (dashboard)/            # Área logada (feed, desafios, eventos, perfil, admin)
│   │   └── admin/              # Painel administrativo (~25 sub-rotas)
│   ├── (marketing)/            # Páginas públicas (newsletter, landing pages, termos)
│   ├── api/                    # API routes (webhooks, cron, integrações)
│   └── layout.tsx              # Layout raiz
├── actions/                    # Server Actions (~45 arquivos, organizados por domínio)
├── components/                 # Componentes React (~22 diretórios por feature)
│   ├── admin/                  # Componentes do painel admin
│   ├── challenges/             # Desafios
│   ├── events/                 # Eventos
│   ├── posts/                  # Feed e posts
│   ├── layout/                 # Header, Sidebar, BottomNav
│   ├── profile/                # Perfil do usuário
│   ├── ranking/                # Leaderboard
│   ├── ui/                     # Componentes reutilizáveis (Input, Modal, Toast, etc.)
│   └── ...                     # editor, onboarding, analytics, social, etc.
├── contexts/                   # React Contexts (Auth, Sidebar)
├── hooks/                      # Custom hooks (~9: usePosts, useInfiniteFeed, useProfile, etc.)
├── lib/                        # Lógica de negócios e utilitários
│   ├── supabase/               # Clientes e queries (client, server, admin, middleware)
│   ├── security/               # Rate-limit, CSRF, validação, audit-log
│   ├── ai/                     # Funções IA (Gemini: análise de leads, descrições)
│   ├── moderation/             # Moderação de conteúdo (toxicidade, imagens)
│   ├── notifications/          # Email (Resend) + WhatsApp (Twilio/Meta)
│   ├── validation/             # Validação com Zod
│   ├── config/                 # Configurações do site
│   ├── analytics/              # Métricas e analytics
│   └── ...                     # sanitize, logger, constants, utils, etc.
├── providers/                  # React Providers (QueryProvider para TanStack Query)
├── types/                      # Tipos TypeScript compartilhados
└── middleware.ts               # Middleware Next.js (sessão Supabase)

supabase/
└── migrations/                 # 94+ arquivos de migração

e2e/                            # Testes E2E Playwright
scripts/                        # Scripts utilitários (16+ arquivos)
docs/                           # Documentação do projeto (26 arquivos)
```

## Princípios de Arquitetura

### Componentes React
- Utilizar **Server Components** por padrão
- Utilizar **Client Components** (`'use client'` no topo) apenas quando necessário para:
  - Interatividade do usuário (formulários complexos, animações)
  - Uso de hooks do React (useState, useEffect, etc.)
  - Eventos do navegador
  - APIs específicas do cliente

### Lógica de Negócios
- Implementar lógica de negócios em **Server Actions** (`src/actions/`)
- Manter a lógica de manipulação de dados fora dos componentes de UI
- Validação de dados tanto no cliente quanto no servidor (Zod)
- Queries do Supabase em `lib/supabase/` (separadas por domínio)

### Gerenciamento de Estado
- **TanStack Query** para estado do servidor (staleTime: 1min, gcTime: 5min)
- **React Context** apenas para estado de UI (auth, sidebar)
- **Supabase Realtime** para features ao vivo (feed, notificações)

### Segurança
- **Supabase Row Level Security (RLS)** é obrigatório para todas as tabelas
- Implementar políticas de acesso granulares para cada tabela
- Autenticação via Supabase Auth (email + Google OAuth)
- Não expor `service_role` key no cliente
- Sanitização de HTML com DOMPurify (`lib/sanitize.ts`)
- Rate limiting com Upstash Redis (`lib/security/rate-limit.ts`)
- Headers de segurança configurados em `next.config.js` (CSP, HSTS, X-Frame-Options)
- Validação de entrada obrigatória em todos os endpoints

## Padrões de Código

### Idioma
- **Comentários e commits**: SEMPRE em português
- **Variáveis e funções**: SEMPRE em inglês (sem acentos no código)
- **Textos visíveis ao usuário** (labels, placeholders, mensagens): SEMPRE em português correto com acentuação
  - ✅ "Configurações", "Repetições", "Descrição"
  - ❌ "Configuracoes", "Repeticoes", "Descricao"

### TypeScript
- Strict mode habilitado
- Tipagem explícita obrigatória, evitar `any`
- Imports absolutos com `@/` (ex: `@/lib/supabase/server`)

### Organização
- Arquivos organizados por funcionalidade/domínio
- Componentes Client devem ter `'use client'` no topo
- Server Actions em `src/actions/` com nomes descritivos
- Tipos compartilhados em `src/types/`

### Git Hooks
- **Pre-commit** (Husky): executa `npm run typecheck`
- **lint-staged**: executa `eslint --fix` em arquivos `.ts` e `.tsx` staged

## Rotas Principais

### Autenticação
- `/login` — Login (email + Google OAuth)
- `/(auth)/registro` — Cadastro
- `/auth/callback` — Callback OAuth
- `/esqueci-senha` — Recuperação de senha

### Dashboard (protegido)
- `/dashboard` — Página inicial
- `/feed` — Feed social
- `/desafios` — Lista de desafios
- `/eventos` — Eventos
- `/ranking` — Leaderboard
- `/premios` — Loja de prêmios
- `/trofeus` — Sala de troféus
- `/perfil` — Perfil do usuário (editar, posts, salvos)

### Admin (protegido, verificação de role)
- `/admin` — Dashboard admin (~25 sub-rotas)
- Inclui: usuários, desafios, eventos, posts, prêmios, resgates, analytics, broadcast, configurações, leads, moderação de comentários, etc.

### Marketing (público)
- `/newsletter` — Página principal de captura (todas as LPs redirecionam para cá)
- `/privacidade` — Política de privacidade
- `/termos` — Termos de serviço

### API
- `/api/cron/*` — CRON jobs (process-tasks a cada 15min, ranking-snapshot diário, onboarding a cada 15min)
- `/api/webhooks/*` — Webhooks (Resend, WhatsApp)
- `/api/newsletter/subscribe` — Inscrição newsletter
- `/api/linkdobem/*` — Integração Link do Bem
- `/api/admin/*` — Operações administrativas

## Features Principais

- **Sistema de gamificação**: Corações/moedas, níveis (Bronze → Platina), conquistas, leaderboard
- **Desafios**: Múltiplos tipos (físico, atos de amor, vídeo, Instagram), participação, veredito por IA
- **Feed social**: Posts com rich text (TipTap), carrossel de imagens, YouTube, likes, comentários
- **Eventos**: Registro, limites de capacidade, acesso por nível
- **Moderação**: Análise de toxicidade (Perspective API), moderação de conteúdo
- **Notificações**: Email (Resend), WhatsApp (Twilio/Meta), sequências automatizadas
- **Admin completo**: Gestão de usuários, analytics, broadcasts, configurações da comunidade

## Variáveis de Ambiente Necessárias

```
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY          # apenas server-side

# Site
NEXT_PUBLIC_SITE_URL

# APIs externas
GEMINI_API_KEY                     # Google Gemini (IA)
UPSTASH_REDIS_REST_URL             # Rate limiting
UPSTASH_REDIS_REST_TOKEN
RESEND_WEBHOOK_SECRET              # Webhook de email
WHATSAPP_APP_SECRET                # Webhook WhatsApp

# Storage
NEXT_PUBLIC_STORAGE_URL            # Supabase Storage
```

## Desenvolvimento

- Priorizar desenvolvimento incremental (MVP primeiro, depois expansão)
- Documentação inline para decisões arquiteturais importantes
- Rodar `npm run verify` antes de submeter PRs (lint + typecheck + build)
- Testes E2E em `e2e/` com Playwright (execução sequencial, 1 worker)
- 94+ migrations Supabase — verificar `supabase/migrations/` para schema atual
