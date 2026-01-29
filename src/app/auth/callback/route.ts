import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { scheduleUserOnboarding, sendOnboardingEmail } from '@/lib/notifications';
import { getLeadSource } from '@/actions/leads';

/**
 * Verifica se o email tem um lead aprovado no NPS
 * Retorna true se aprovado, false caso contrário
 */
async function hasApprovedLead(email: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('nps_leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    // Em caso de erro, não bloquear (fail-open para não travar logins existentes)
    console.error('[Auth Callback] Erro ao verificar lead aprovado');
    return true;
  }
}

/**
 * Verifica se o usuário já existe na tabela users (login recorrente vs primeiro acesso)
 */
async function isExistingUser(email: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

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
 * Agora suporta query strings (ex: /desafios?highlight=xxx)
 */
function isValidRedirect(path: string): boolean {
  // Rejeita URLs absolutas ou protocolos
  if (path.startsWith('//') || path.includes('://') || path.startsWith('javascript:')) {
    return false;
  }
  // Extrair apenas o pathname (sem query string)
  const pathname = path.split('?')[0];
  // Verifica se comeca com uma rota permitida
  return ALLOWED_REDIRECTS.some(allowed =>
    pathname === allowed || pathname.startsWith(`${allowed}/`)
  );
}

interface SourceData {
  type: string;
  id: string;
  name?: string;
}

/**
 * Obter dados de origem do cookie de cadastro direto
 * Usado quando o usuário vem de landing page no modo direto (sem NPS)
 */
async function getDirectRegistrationSource(): Promise<{ sourceData: SourceData | null; redirectUrl: string | null }> {
  try {
    const cookieStore = await cookies();
    const sourceCookie = cookieStore.get('direct_registration_source');

    if (!sourceCookie?.value) {
      return { sourceData: null, redirectUrl: null };
    }

    const sourceData = JSON.parse(decodeURIComponent(sourceCookie.value)) as SourceData;

    if (!sourceData.type || !sourceData.id) {
      return { sourceData: null, redirectUrl: null };
    }

    // Determinar URL de redirecionamento baseado no tipo de origem
    let redirectUrl: string | null = null;
    if (sourceData.type === 'landing_challenge' || sourceData.type === 'landing_challenge_direto') {
      redirectUrl = `/desafios?highlight=${sourceData.id}`;
    } else if (sourceData.type === 'landing_reward' || sourceData.type === 'landing_reward_direto') {
      redirectUrl = `/premios?highlight=${sourceData.id}`;
    }

    return { sourceData, redirectUrl };
  } catch {
    return { sourceData: null, redirectUrl: null };
  }
}

/**
 * Salvar origem do cadastro no perfil do usuário
 * (para estatísticas de landing pages)
 */
async function saveUserSignupSource(userId: string, source: SourceData) {
  try {
    const supabase = createAdminClient();
    
    await supabase.rpc('set_user_signup_source', {
      p_user_id: userId,
      p_source: source.type,
      p_source_id: source.id,
      p_source_name: source.name || null,
    });

    console.log('[Auth Callback] Origem do cadastro salva:', source.type, source.id);
  } catch (err) {
    // Erro não deve impedir o login
    console.error('[Auth Callback] Erro ao salvar origem:', err);
  }
}

/**
 * Limpar cookie de cadastro direto após uso
 */
async function clearDirectRegistrationCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('direct_registration_source');
  } catch {
    // Ignorar erros ao limpar cookie
  }
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
        // SEGURANÇA: Para novos usuários (Google OAuth), verificar se tem lead aprovado
        // Usuários existentes (login recorrente) passam direto
        if (user.email) {
          const existing = await isExistingUser(user.email);
          if (!existing) {
            const approved = await hasApprovedLead(user.email);
            if (!approved) {
              // Novo usuário sem lead aprovado — revogar sessão e redirecionar
              console.warn('[Auth Callback] Novo usuário Google sem lead aprovado:', user.email);
              await supabase.auth.signOut();
              return NextResponse.redirect(
                `${origin}/login?error=lead_required&message=${encodeURIComponent(
                  'Para criar sua conta, primeiro preencha o formulário de inscrição em /seja-arena'
                )}`
              );
            }
          }
        }

        // Iniciar onboarding para novos usuários (em background, não bloqueia)
        triggerOnboardingIfNew(user.id, user.email || '', user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário');

        // Verificar se usuário veio de uma landing page
        // 1. Primeiro verificar cookie de cadastro direto (sem NPS)
        const { sourceData, redirectUrl: directRedirect } = await getDirectRegistrationSource();
        
        // Salvar origem do cadastro no perfil (se tiver)
        if (sourceData) {
          await saveUserSignupSource(user.id, sourceData);
          await clearDirectRegistrationCookie();
        }

        // Verificar redirecionamento
        if (next === '/') {
          // Redirecionar para landing page se veio de cadastro direto
          if (directRedirect && isValidRedirect(directRedirect)) {
            return NextResponse.redirect(`${origin}${directRedirect}`);
          }

          // Depois verificar se veio do fluxo NPS (via nps_leads)
          if (user.email) {
            const { redirectUrl, sourceType, sourceId, sourceName } = await getLeadSource(user.email);
            
            // Salvar origem do NPS se ainda não salvou do cookie
            if (!sourceData && sourceType) {
              await saveUserSignupSource(user.id, { 
                type: sourceType, 
                id: sourceId || '', 
                name: sourceName || undefined 
              });
            }
            
            if (isValidRedirect(redirectUrl) && redirectUrl !== '/dashboard') {
              return NextResponse.redirect(`${origin}${redirectUrl}`);
            }
          }
        }

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
