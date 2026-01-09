# 🔐 Fluxo de Autenticação

Este documento detalha todos os fluxos de autenticação da plataforma Arena Te Amo, incluindo login com Google OAuth, gerenciamento de sessão, proteção de rotas e contexto de autenticação no cliente.

## Índice

1. [Visão Geral](#visão-geral)
2. [Login com Google OAuth](#login-com-google-oauth)
3. [Callback do OAuth](#callback-do-oauth)
4. [Criação e Gerenciamento de Sessão](#criação-e-gerenciamento-de-sessão)
5. [Middleware de Proteção de Rotas](#middleware-de-proteção-de-rotas)
6. [Contexto de Autenticação no Cliente](#contexto-de-autenticação-no-cliente)
7. [Fluxo Completo de Login](#fluxo-completo-de-login)
8. [Logout](#logout)
9. [Arquivos Relacionados](#arquivos-relacionados)

---

## Visão Geral

A autenticação na plataforma utiliza **Supabase Auth** com suporte a:
- 🔑 **OAuth Google** (método principal)
- 📧 **Email/Senha** (método alternativo via Server Actions)
- 🔒 **Session Management** via cookies HTTP-only
- 🛡️ **RLS (Row Level Security)** para acesso ao banco de dados

```mermaid
graph LR
    A[👤 Usuário] --> B{Método de Login}
    B -->|OAuth Google| C[🔐 Google OAuth Flow]
    B -->|Email/Senha| D[📧 Server Action]

    C --> E[🎫 Callback]
    D --> E

    E --> F[✅ Sessão Criada]
    F --> G[🍪 Cookies Configurados]
    G --> H[🛡️ Middleware Valida]
    H --> I[📱 Dashboard]

    style C fill:#4285F4,color:#fff
    style D fill:#6366f1,color:#fff
    style F fill:#10b981,color:#fff
    style H fill:#f59e0b,color:#fff
    style I fill:#8b5cf6,color:#fff
```

---

## Login com Google OAuth

O fluxo de login com Google OAuth é iniciado no cliente através do `AuthContext` e gerenciado pelo Supabase.

### Diagrama de Sequência - Login Google

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant LP as 🖥️ Login Page
    participant AC as 🎯 AuthContext
    participant SC as 📦 Supabase Client
    participant G as 🔐 Google OAuth
    participant SB as ☁️ Supabase Auth

    U->>LP: Clica "Entrar com Google"
    LP->>AC: handleGoogleSignIn()
    AC->>SC: signInWithOAuth({ provider: 'google' })

    Note over SC: redirectTo: /auth/callback

    SC->>SB: Inicia fluxo OAuth
    SB->>G: Redireciona para Google

    G->>U: Tela de autenticação Google
    U->>G: Aprova permissões

    G->>SB: Retorna código OAuth
    SB-->>SC: Redireciona com code

    Note over SC: Browser redireciona para<br/>/auth/callback?code=...
```

### Código: Iniciando Login com Google

**Localização**: `src/contexts/AuthContext.tsx`

```typescript
// Login com Google
const signInWithGoogle = useCallback(async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Erro ao fazer login com Google:', error);
    throw error;
  }
}, [supabase.auth]);
```

**Localização**: `src/app/login/page.tsx`

```typescript
// Função para lidar com o login
async function handleGoogleSignIn() {
  setIsSigningIn(true);
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    setIsSigningIn(false);
  }
}
```

---

## Callback do OAuth

Após a autenticação no Google, o usuário é redirecionado para `/auth/callback` onde o código OAuth é trocado por uma sessão.

### Diagrama de Sequência - Callback

```mermaid
sequenceDiagram
    participant G as 🔐 Google
    participant CB as 🎫 Callback Route
    participant SC as 📦 Supabase Client
    participant SB as ☁️ Supabase Auth
    participant MW as 🛡️ Middleware
    participant DB as 🗄️ Database

    G->>CB: GET /auth/callback?code=ABC123

    Note over CB: Route Handler executa

    CB->>SC: createClient() (server)
    CB->>SC: exchangeCodeForSession(code)

    SC->>SB: Troca código por tokens
    SB->>SB: Valida código OAuth
    SB->>DB: Busca/Cria usuário

    alt Sucesso
        SB-->>SC: { session, user }
        SC-->>CB: { error: null }
        CB->>CB: Configura cookies de sessão
        CB-->>G: Redirect 302 → /dashboard

        Note over CB,MW: Cookies com tokens são enviados

        MW->>MW: Valida sessão
        G->>DB: Usuário acessa dashboard
    else Erro
        SB-->>SC: { error }
        CB-->>G: Redirect 302 → /login?error=...
    end
```

### Código: Route Handler de Callback

**Localização**: `src/app/auth/callback/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redireciona para login em caso de erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

### Fluxo de Decisão - Callback

```mermaid
flowchart TD
    A[🎫 Callback Recebido] --> B{code existe?}

    B -->|Não| Z[❌ Redirect /login]

    B -->|Sim| C[📦 createClient server]
    C --> D[🔄 exchangeCodeForSession]

    D --> E{Sucesso?}

    E -->|Não| Z
    E -->|Sim| F[✅ Sessão criada]

    F --> G[🍪 Cookies configurados]
    G --> H[🔀 Redirect /dashboard]
    H --> I[🛡️ Middleware valida]
    I --> J[✨ Dashboard renderizado]

    style A fill:#3b82f6,color:#fff
    style F fill:#10b981,color:#fff
    style G fill:#f59e0b,color:#fff
    style H fill:#8b5cf6,color:#fff
    style Z fill:#ef4444,color:#fff
```

---

## Criação e Gerenciamento de Sessão

O Supabase gerencia sessões através de cookies HTTP-only seguros. Existem três tipos de clientes Supabase dependendo do contexto.

### Tipos de Clientes Supabase

```mermaid
graph TD
    subgraph "Ambiente"
        A[🌐 Browser]
        B[⚙️ Server Component]
        C[🔧 Server Action]
        D[🛡️ Middleware]
    end

    subgraph "Cliente Supabase"
        E[📱 Browser Client<br/>createBrowserClient]
        F[🖥️ Server Client<br/>createServerClient + cookies]
        G[🔄 Middleware Client<br/>createServerClient + request]
    end

    A --> E
    B --> F
    C --> F
    D --> G

    subgraph "Configuração de Cookies"
        H[🍪 getAll]
        I[🍪 setAll]
    end

    E --> H
    F --> H
    F --> I
    G --> H
    G --> I

    style E fill:#3b82f6,color:#fff
    style F fill:#8b5cf6,color:#fff
    style G fill:#f59e0b,color:#fff
```

### Cliente Browser (Client Components)

**Localização**: `src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- ✅ **Uso**: Client Components, Context API
- 🍪 **Cookies**: Gerenciados automaticamente pelo browser
- 🔄 **Auto-refresh**: Tokens renovados automaticamente

### Cliente Server (Server Components e Actions)

**Localização**: `src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignora erro quando chamado de Server Component (somente leitura)
          }
        },
      },
    }
  );
}
```

- ✅ **Uso**: Server Components, Server Actions, Route Handlers
- 🍪 **Cookies**: Leitura/escrita via `next/headers`
- 🔒 **Segurança**: Cookies HTTP-only não acessíveis pelo JavaScript

### Ciclo de Vida da Sessão

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant B as 🌐 Browser
    participant S as ☁️ Supabase
    participant DB as 🗄️ Database

    Note over U,DB: 1️⃣ Login
    U->>B: Login (OAuth ou Email)
    B->>S: Autenticação
    S->>DB: Valida credenciais
    S-->>B: Access Token + Refresh Token
    B->>B: Armazena em cookies HTTP-only

    Note over U,DB: 2️⃣ Requisições Autenticadas
    B->>S: Request com Access Token
    S->>S: Valida token
    alt Token válido
        S->>DB: Query com user_id
        DB-->>S: Dados (via RLS)
        S-->>B: Response
    else Token expirado
        B->>S: Refresh Token
        S-->>B: Novo Access Token
        B->>S: Retry com novo token
        S->>DB: Query
        DB-->>S: Dados
        S-->>B: Response
    end

    Note over U,DB: 3️⃣ Logout
    U->>B: Logout
    B->>S: signOut()
    S->>S: Invalida tokens
    B->>B: Remove cookies
    B-->>U: Redirect /login
```

---

## Middleware de Proteção de Rotas

O middleware Next.js intercepta **todas** as requisições para validar sessões e proteger rotas.

### Fluxo do Middleware

```mermaid
flowchart TD
    A[📨 Requisição Recebida] --> B[🛡️ Middleware]

    B --> C[📦 createServerClient]
    C --> D[🔍 getUser via cookies]

    D --> E{Usuário<br/>autenticado?}

    E -->|Não| F{Rota protegida?<br/>/dashboard/*}
    E -->|Sim| G{Rota de auth?<br/>/login, /registro}

    F -->|Sim| H[🔀 Redirect → /login]
    F -->|Não| I[✅ Continuar]

    G -->|Sim| J[🔀 Redirect → /dashboard]
    G -->|Não| K[✅ Continuar]

    H --> L[🍪 Response com cookies]
    I --> L
    J --> L
    K --> L

    L --> M[📤 Response enviado]

    style A fill:#3b82f6,color:#fff
    style B fill:#f59e0b,color:#fff
    style H fill:#ef4444,color:#fff
    style J fill:#8b5cf6,color:#fff
    style I fill:#10b981,color:#fff
    style K fill:#10b981,color:#fff
```

### Código do Middleware

**Localização**: `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Atualiza a sessão do Supabase
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Regex para caminhos que requerem atualização de sessão:
     * - todas as rotas exceto arquivos estáticos, favicon, api, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Localização**: `src/lib/supabase/middleware.ts`

```typescript
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Atualiza a sessão - importante para manter tokens válidos
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteção de rotas: redireciona usuários não autenticados
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/registro');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');

  // Se não está autenticado e tenta acessar área protegida
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se está autenticado e tenta acessar páginas de auth
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### Tabela: Comportamento de Proteção de Rotas

| Rota | Usuário Autenticado | Usuário Não Autenticado |
|------|---------------------|-------------------------|
| `/` | ✅ Acesso permitido | ✅ Acesso permitido |
| `/login` | 🔀 Redirect `/dashboard` | ✅ Acesso permitido |
| `/registro` | 🔀 Redirect `/dashboard` | ✅ Acesso permitido |
| `/dashboard` | ✅ Acesso permitido | 🔀 Redirect `/login` |
| `/dashboard/*` | ✅ Acesso permitido | 🔀 Redirect `/login` |
| `/api/*` | ⚠️ Depende da implementação | ⚠️ Depende da implementação |

---

## Contexto de Autenticação no Cliente

O `AuthContext` fornece acesso global ao estado de autenticação em Client Components.

### Arquitetura do AuthContext

```mermaid
graph TD
    subgraph "App Root"
        A[🎯 RootLayout]
    end

    A --> B[📦 AuthProvider]

    subgraph "AuthContext State"
        C[👤 user: User | null]
        D[🎫 session: Session | null]
        E[⏳ isLoading: boolean]
    end

    B --> C
    B --> D
    B --> E

    subgraph "Actions"
        F[🔐 signInWithGoogle]
        G[🚪 signOut]
    end

    B --> F
    B --> G

    subgraph "Listeners"
        H[👂 onAuthStateChange]
        I[🔄 Auto-refresh tokens]
    end

    B --> H
    B --> I

    subgraph "Children Components"
        J[📱 Header]
        K[🖥️ Login Page]
        L[📊 Dashboard]
        M[... qualquer componente]
    end

    B --> J
    B --> K
    B --> L
    B --> M

    J -.useAuth.-> C
    K -.useAuth.-> F
    L -.useAuth.-> C

    style B fill:#8b5cf6,color:#fff
    style C fill:#3b82f6,color:#fff
    style D fill:#3b82f6,color:#fff
    style E fill:#3b82f6,color:#fff
    style F fill:#10b981,color:#fff
    style G fill:#ef4444,color:#fff
    style H fill:#f59e0b,color:#fff
```

### Código: AuthContext

**Localização**: `src/contexts/AuthContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Obtém a sessão inicial
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase.auth]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
```

### Fluxo de Sincronização - onAuthStateChange

```mermaid
sequenceDiagram
    participant AC as 📦 AuthContext
    participant SB as ☁️ Supabase Client
    participant LS as 💾 LocalStorage/Cookies
    participant UI as 🖥️ UI Components

    Note over AC,UI: Inicialização
    AC->>SB: getSession()
    SB->>LS: Lê cookies
    LS-->>SB: session data
    SB-->>AC: initialSession
    AC->>AC: setUser(session?.user)
    AC->>AC: setIsLoading(false)
    AC-->>UI: Estado inicial disponível

    Note over AC,UI: Listener Ativo
    AC->>SB: onAuthStateChange(callback)

    Note over AC,UI: Evento: Token Refresh
    SB->>SB: Access token expira
    SB->>SB: Auto-refresh com refresh token
    SB->>AC: evento: TOKEN_REFRESHED
    AC->>AC: Atualiza session

    Note over AC,UI: Evento: Login
    UI->>AC: signInWithGoogle()
    AC->>SB: signInWithOAuth()
    SB-->>AC: SIGNED_IN event
    AC->>AC: setUser(newUser)
    AC-->>UI: Re-render com user

    Note over AC,UI: Evento: Logout
    UI->>AC: signOut()
    AC->>SB: signOut()
    SB->>LS: Remove cookies
    SB-->>AC: SIGNED_OUT event
    AC->>AC: setUser(null)
    AC-->>UI: Re-render sem user
```

### Uso do Hook useAuth

```typescript
// Em qualquer Client Component
'use client';

import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <div>Não autenticado</div>;
  }

  return (
    <div>
      <p>Olá, {user.email}</p>
      <button onClick={signOut}>Sair</button>
    </div>
  );
}
```

---

## Fluxo Completo de Login

Visualização integrada de todo o processo, do clique no botão até o dashboard.

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant LP as 🖥️ Login Page
    participant AC as 🎯 AuthContext
    participant G as 🔐 Google
    participant CB as 🎫 Callback Route
    participant MW as 🛡️ Middleware
    participant SC as ☁️ Supabase
    participant DB as 🗄️ Database
    participant D as 📊 Dashboard

    rect rgb(220, 240, 255)
        Note over U,AC: 1️⃣ Iniciação do Login
        U->>LP: Clica "Entrar com Google"
        LP->>AC: handleGoogleSignIn()
        AC->>SC: signInWithOAuth({ provider: 'google' })
        SC-->>U: Redirect para Google
    end

    rect rgb(255, 240, 220)
        Note over U,G: 2️⃣ Autenticação no Google
        U->>G: Faz login no Google
        U->>G: Aprova permissões
        G-->>CB: Redirect com code
    end

    rect rgb(220, 255, 240)
        Note over CB,DB: 3️⃣ Callback e Criação de Sessão
        CB->>SC: exchangeCodeForSession(code)
        SC->>SC: Valida code
        SC->>DB: Busca/Cria usuário
        DB-->>SC: user data
        SC->>SC: Gera access_token + refresh_token
        SC-->>CB: { session, user }
        CB->>CB: Configura cookies HTTP-only
        CB-->>U: Redirect 302 → /dashboard
    end

    rect rgb(255, 245, 220)
        Note over MW,D: 4️⃣ Acesso ao Dashboard
        U->>MW: GET /dashboard
        MW->>MW: getUser() via cookies
        MW->>MW: Valida sessão
        alt Sessão válida
            MW-->>D: Permite acesso
            D->>SC: Fetch dados do usuário
            SC->>DB: Query com RLS
            DB-->>SC: Dados permitidos
            SC-->>D: User data
            D-->>U: Dashboard renderizado
        else Sessão inválida
            MW-->>U: Redirect → /login
        end
    end

    rect rgb(245, 220, 255)
        Note over AC,D: 5️⃣ Sincronização do Cliente
        AC->>SC: onAuthStateChange detecta login
        AC->>AC: setUser(user)
        AC->>AC: setSession(session)
        AC-->>D: Estado atualizado
        D->>D: Re-render com dados do usuário
    end
```

### Timeline do Fluxo Completo

```mermaid
gantt
    title Tempo de Execução do Fluxo de Login
    dateFormat X
    axisFormat %S s

    section Cliente
    Clique no botão           :0, 0.1s
    Redirect para Google      :0.1s, 0.2s
    Autenticação Google       :0.2s, 3s

    section Server
    Callback processa code    :3s, 0.5s
    Troca code por sessão     :3.5s, 1s
    Configura cookies         :4.5s, 0.2s

    section Middleware
    Valida sessão             :4.7s, 0.3s
    Permite acesso            :5s, 0.1s

    section Renderização
    Carrega dashboard         :5.1s, 0.5s
    Fetch dados               :5.6s, 0.4s
    Renderiza UI              :6s, 0.3s
```

---

## Logout

O processo de logout limpa a sessão tanto no cliente quanto no servidor.

### Fluxo de Logout

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant UI as 🖥️ UI Component
    participant AC as 🎯 AuthContext
    participant SC as ☁️ Supabase Client
    participant SB as ☁️ Supabase Auth
    participant C as 🍪 Cookies

    U->>UI: Clica "Sair"

    alt Via AuthContext (Client)
        UI->>AC: signOut()
        AC->>SC: supabase.auth.signOut()
    else Via Server Action
        UI->>SA: logout() Server Action
        SA->>SC: supabase.auth.signOut()
    end

    SC->>SB: Invalida sessão
    SB->>SB: Revoga tokens
    SB-->>SC: Success

    SC->>C: Remove cookies de sessão
    C->>C: Deleta access_token
    C->>C: Deleta refresh_token

    SC-->>AC: SIGNED_OUT event
    AC->>AC: setUser(null)
    AC->>AC: setSession(null)

    alt Via AuthContext
        UI->>UI: Router.push('/login')
    else Via Server Action
        SC->>SC: redirect('/login')
    end

    UI-->>U: Página de login exibida
```

### Código: Logout via Server Action

**Localização**: `src/actions/auth.ts`

```typescript
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
```

### Código: Logout via AuthContext

**Localização**: `src/contexts/AuthContext.tsx`

```typescript
const signOut = useCallback(async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}, [supabase.auth]);
```

---

## Arquivos Relacionados

### Estrutura de Arquivos de Autenticação

```
src/
├── app/
│   ├── layout.tsx                    # AuthProvider wrapping
│   ├── login/
│   │   └── page.tsx                  # Login page com Google OAuth
│   └── auth/
│       └── callback/
│           └── route.ts              # OAuth callback handler
│
├── contexts/
│   └── AuthContext.tsx               # Context + Provider + Hook
│
├── lib/
│   └── supabase/
│       ├── client.ts                 # Browser client
│       ├── server.ts                 # Server client
│       └── middleware.ts             # Middleware session handler
│
├── actions/
│   └── auth.ts                       # Server Actions (login, logout, etc)
│
└── middleware.ts                     # Next.js middleware (route protection)
```

### Mapa de Responsabilidades

| Arquivo | Responsabilidade | Ambiente |
|---------|------------------|----------|
| `src/middleware.ts` | Intercepta requisições, valida sessão | Edge Runtime |
| `src/lib/supabase/middleware.ts` | Lógica de proteção de rotas | Edge Runtime |
| `src/lib/supabase/server.ts` | Cliente Supabase para server-side | Node.js Runtime |
| `src/lib/supabase/client.ts` | Cliente Supabase para client-side | Browser |
| `src/contexts/AuthContext.tsx` | Estado global de auth + listeners | Browser |
| `src/app/login/page.tsx` | UI de login | Browser |
| `src/app/auth/callback/route.ts` | Troca code por session | Node.js Runtime |
| `src/actions/auth.ts` | Server Actions de auth | Node.js Runtime |

---

## Resumo dos Fluxos

### ✅ Pontos Fortes da Arquitetura

1. **Segurança em Camadas**
   - 🍪 Cookies HTTP-only (não acessíveis por JS)
   - 🛡️ Middleware valida toda requisição
   - 🔒 RLS protege dados no banco

2. **Separação de Responsabilidades**
   - 📱 Cliente: UI e estado local
   - ⚙️ Server: Lógica de negócio e validação
   - 🛡️ Middleware: Proteção de rotas
   - ☁️ Supabase: Autenticação e dados

3. **Developer Experience**
   - 🎯 Context API para fácil acesso ao user
   - 🔄 Auto-refresh de tokens transparente
   - 📦 Três clientes Supabase otimizados por contexto

4. **Performance**
   - ⚡ Server Components por padrão
   - 🔄 Validação no Edge (baixa latência)
   - 🍪 Sessão via cookies (sem localStorage)

### 🔐 Fluxos Principais

| Fluxo | Trigger | Componentes Envolvidos | Resultado |
|-------|---------|------------------------|-----------|
| **Login Google** | Clique no botão | AuthContext → Supabase → Google → Callback | Sessão criada, redirect /dashboard |
| **Proteção de Rota** | Acesso a /dashboard | Middleware → Supabase → RLS | Usuário validado ou redirect /login |
| **Auto-refresh** | Token expira | Supabase Client (automático) | Novo access_token obtido |
| **Logout** | Clique "Sair" | AuthContext/ServerAction → Supabase | Sessão destruída, redirect /login |
| **State Sync** | Qualquer mudança de auth | onAuthStateChange → AuthContext | UI re-renderiza com novo estado |

---

## Próximos Documentos

- 📝 [Fluxo de Posts](./DATA_FLOW_POSTS.md) - Criação, moderação e feed
- 🎯 [Fluxo de Desafios](./DATA_FLOW_CHALLENGES.md) - Participação e recompensas
- 🎉 [Fluxo de Eventos](./DATA_FLOW_EVENTS.md) - Registro e check-in
- 👤 [Fluxo de Perfil](./DATA_FLOW_PROFILE_REWARDS.md) - Níveis e recompensas

---

**Documentação gerada para**: Arena Te Amo Platform
**Última atualização**: 2026-01-07
**Versão**: 1.0.0
