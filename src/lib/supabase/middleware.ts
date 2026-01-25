/**
 * Middleware do Supabase para gerenciamento de sessão
 * Suporta multi-domínio:
 * - comece.omocodoteamo.com.br: Landing page pública (sem login)
 * - comunidade.omocodoteamo.com.br: Plataforma fechada (requer login)
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
];

// Rotas que requerem role de admin
const ADMIN_ROUTES = ['/admin'];

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
