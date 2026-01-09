/**
 * Middleware do Supabase para gerenciamento de sessão
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

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

  // Rotas públicas (não precisam de autenticação)
  const publicRoutes = [
    '/',
    '/login',
    '/registro',
    '/seja-nextlover',
    '/auth/callback',
    '/admin/login',
  ];

  const pathname = request.nextUrl.pathname;

  // Verifica se é rota pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Rotas de autenticação (login/registro)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/registro');

  // Se não está autenticado e tenta acessar área protegida
  if (!user && !isPublicRoute) {
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
