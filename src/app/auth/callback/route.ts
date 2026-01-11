import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Lista de rotas permitidas para redirect (previne Open Redirect)
const ALLOWED_REDIRECTS = [
  '/',
  '/dashboard',
  '/perfil',
  '/desafios',
  '/eventos',
  '/ranking',
  '/premios',
  '/feed',
  '/admin',
];

/**
 * Valida se o redirect e seguro (previne Open Redirect attacks)
 */
function isValidRedirect(path: string): boolean {
  // Rejeita URLs absolutas ou protocolos
  if (path.startsWith('//') || path.includes('://') || path.startsWith('javascript:')) {
    return false;
  }
  // Verifica se comeca com uma rota permitida
  return ALLOWED_REDIRECTS.some(allowed =>
    path === allowed || path.startsWith(`${allowed}/`)
  );
}

/**
 * Rota de callback para autenticação do Supabase
 * Usada para confirmação de email e OAuth
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next') ?? '/';

  // Validar redirect para prevenir Open Redirect
  const next = isValidRedirect(requestedNext) ? requestedNext : '/';

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
