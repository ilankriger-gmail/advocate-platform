import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { scheduleUserOnboarding, sendOnboardingEmail } from '@/lib/notifications';

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
 * Rota de callback para autenticacao do Supabase
 * Usada para confirmacao de email e OAuth
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
      // SEGURANCA: Validar que a sessao foi criada corretamente
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Iniciar onboarding para novos usuários (em background, não bloqueia)
        triggerOnboardingIfNew(user.id, user.email || '', user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário');

        return NextResponse.redirect(`${origin}${next}`);
      }

      // Sessao invalida mesmo sem erro - tratar como falha
      console.error('[Auth Callback] Sessao criada mas usuario nao encontrado');
    }
  }

  // Redireciona para login em caso de erro
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}

/**
 * Inicia o onboarding para novos usuários
 * Executa em background (não bloqueia o redirect)
 */
async function triggerOnboardingIfNew(userId: string, email: string, name: string) {
  try {
    const supabase = createAdminClient();

    // Verificar se já tem onboarding (evita duplicatas)
    const { data: existing } = await supabase
      .from('user_onboarding')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Já tem onboarding, não fazer nada
      return;
    }

    console.log('[Auth Callback] Iniciando onboarding para novo usuário:', userId);

    // 1. Agendar emails 2 e 3 (cria registro de onboarding)
    await scheduleUserOnboarding(userId, { email, name });

    // 2. Enviar Email 1 imediatamente
    await sendOnboardingEmail({
      to: email,
      name,
      userId,
      step: 1,
    });

    console.log('[Auth Callback] Onboarding iniciado com sucesso para:', email);
  } catch (err) {
    // Erro no onboarding não deve impedir o login
    console.error('[Auth Callback] Erro ao iniciar onboarding:', err);
  }
}
