/**
 * Middleware do Supabase para gerenciamento de sessão
 * Suporta multi-domínio:
 * - comece.omocodoteamo.com.br: Landing page pública (sem login)
 * - comunidade.omocodoteamo.com.br: Plataforma fechada (requer login)
 * 
 * Inclui sistema de pausa da comunidade:
 * - Quando community_paused=true em site_settings, redireciona para /pausado
 * - Admin, prêmios, newsletter e rotas de API continuam acessíveis
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Domínios da aplicação
const COMECE_DOMAIN = 'comece.omocodoteamo.com.br';
const COMUNIDADE_DOMAIN = 'comunidade.omocodoteamo.com.br';

// Rotas permitidas no domínio comece (totalmente público)
const COMECE_ALLOWED_ROUTES = ['/', '/seja-arena', '/termos', '/privacidade'];

// Rotas públicas no domínio comunidade (não requerem auth)
const COMUNIDADE_PUBLIC_ROUTES = [
  '/login',
  '/auth/callback',
  '/auth/reset-password',
  '/esqueci-senha',
  '/seja-arena',
  '/registro',
  '/termos',
  '/privacidade',
  '/lp', // Landing pages de desafios e prêmios (com NPS)
  '/convite', // Landing pages diretas (sem NPS)
  '/tools', // Mini-apps e ferramentas internas
  '/newsletter', // Newsletter signup
  '/pausado', // Página de comunidade pausada
];

// Rotas que requerem role de admin
const ADMIN_ROUTES = ['/admin'];

// Rotas que continuam acessíveis durante pausa da comunidade
const PAUSE_EXEMPT_ROUTES = [
  '/admin',       // Admin panel (gestão continua)
  '/premios',     // Usuários precisam ver/resgatar prêmios
  '/pausado',     // A própria página de pausa
  '/newsletter',  // Captação de leads continua
  '/login',       // Auth precisa funcionar (pra acessar /premios)
  '/auth',        // Callbacks de auth
  '/registro',    // Registro (pode querer se cadastrar na newsletter)
  '/esqueci-senha',
  '/termos',
  '/privacidade',
  '/api',         // APIs continuam funcionando (cron jobs, etc.)
  '/tools',       // Mini-apps internos
  '/lp',          // Landing pages
  '/convite',     // Convites
];

// Cache simples para o status de pausa (evita query a cada request)
let pauseCache: { value: boolean; timestamp: number } | null = null;
const PAUSE_CACHE_TTL_MS = 30_000; // 30 seconds

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

  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';

  // === DOMÍNIO COMECE: Totalmente público, sem login ===
  if (host === COMECE_DOMAIN) {
    // Verificar se a rota é permitida no domínio comece
    const isAllowedRoute = COMECE_ALLOWED_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + '/')
    );

    // Se não é rota permitida, redireciona para a landing page
    if (!isAllowedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/seja-arena';
      return NextResponse.redirect(url);
    }

    // Rota permitida, continua normalmente (sem verificar auth)
    return supabaseResponse;
  }

  // === DOMÍNIO COMUNIDADE ou LOCALHOST: Requer autenticação ===

  // Verifica se é rota pública no domínio comunidade
  const isPublicRoute = COMUNIDADE_PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Rotas de autenticação (login)
  const isAuthRoute = pathname.startsWith('/login');

  // Se não está autenticado e tenta acessar área protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Se está autenticado e tenta acessar páginas de auth
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // === COMMUNITY PAUSE CHECK ===
  // Verifica se a comunidade está em pausa e redireciona se necessário
  const isPauseExempt = PAUSE_EXEMPT_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (!isPauseExempt) {
    const isPaused = await checkCommunityPaused(supabase);
    if (isPaused) {
      const url = request.nextUrl.clone();
      url.pathname = '/pausado';
      return NextResponse.redirect(url);
    }
  }

  // === PROTECAO DE ROTAS ADMIN ===
  // SEGURANCA: Verificar role antes de permitir acesso a rotas admin
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isAdminRoute && user) {
    // Buscar perfil do usuario para verificar role
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    // Se nao e admin, creator ou is_creator, negar acesso
    const userRole = profile?.role;
    const isCreator = profile?.is_creator;
    if (userRole !== 'admin' && userRole !== 'creator' && !isCreator) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

/**
 * Verifica se a comunidade está pausada (com cache de 30s)
 */
async function checkCommunityPaused(supabase: ReturnType<typeof createServerClient>): Promise<boolean> {
  // Check cache first
  const now = Date.now();
  if (pauseCache && (now - pauseCache.timestamp) < PAUSE_CACHE_TTL_MS) {
    return pauseCache.value;
  }

  try {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'community_paused')
      .single();

    const isPaused = data?.value === 'true';
    pauseCache = { value: isPaused, timestamp: now };
    return isPaused;
  } catch {
    // Em caso de erro, não pausar (fail-open)
    return false;
  }
}
