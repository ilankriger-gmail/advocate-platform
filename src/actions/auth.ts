'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import { validatePassword } from '@/lib/password-validation';

// Tipos para respostas das actions
type AuthResponse = {
  error?: string;
  success?: boolean;
};

/**
 * Helper para obter IP do cliente em Server Actions
 */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') || 'unknown';
}

/**
 * Server Action para login com email e senha
 * Protegido com rate limiting (5 tentativas/minuto por IP)
 */
export async function login(formData: FormData): Promise<AuthResponse> {
  // Rate limiting por IP
  const ip = await getClientIP();
  const rateLimitResult = await checkRateLimit(`login:${ip}`, RATE_LIMITS.login);

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return { error: `Muitas tentativas. Aguarde ${retryAfter} segundos.` };
  }

  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validacao basica
  if (!email || !password) {
    return { error: 'Email e senha sao obrigatorios' };
  }

  // Normalizar email para lowercase
  const normalizedEmail = email.toLowerCase().trim();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) {
    // SEGURANCA: Mensagem generica para evitar enumeracao de usuarios
    // Nao revelar se o email existe ou se a senha esta incorreta
    return { error: 'Credenciais invalidas' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Server Action para registro de novo usuario
 * Apenas emails aprovados no NPS podem se registrar
 * Protegido com rate limiting (3 tentativas/minuto por IP)
 */
export async function register(formData: FormData): Promise<AuthResponse> {
  // Rate limiting por IP
  const ip = await getClientIP();
  const rateLimitResult = await checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup);

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return { error: `Muitas tentativas. Aguarde ${retryAfter} segundos.` };
  }

  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const ageConfirmed = formData.get('ageConfirmed');

  // Validacao de idade (COPPA compliance)
  if (!ageConfirmed) {
    return { error: 'Você precisa confirmar que tem 13 anos ou mais' };
  }

  // Validacoes basicas
  if (!name || !email || !password) {
    return { error: 'Todos os campos sao obrigatorios' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas nao coincidem' };
  }

  // Validacao robusta de senha (8+ chars, maiuscula, minuscula, numero)
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] };
  }

  // Normalizar email para lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // NOTA: Cadastro direto é aberto para qualquer pessoa.
  // O NPS (/seja-arena) é apenas um dos caminhos de entrada.
  // Não bloqueamos registro por falta de lead aprovado.

  const referralCode = (formData.get('ref') as string)?.trim() || '';

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    // SEGURANCA: Mensagem generica para todos os erros
    return { error: 'Nao foi possivel criar a conta. Verifique seus dados.' };
  }

  // Processar código de indicação (se houver)
  if (referralCode && signUpData?.user?.id) {
    try {
      const { registerReferral } = await import('@/actions/referrals');
      await registerReferral(signUpData.user.id, referralCode);
    } catch (refErr) {
      // Não falhar o registro por causa de referral
      console.error('[Auth] Erro ao registrar indicação:', refErr);
    }
  }

  return { success: true };
}

/**
 * Server Action para logout
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Server Action para recuperacao de senha
 * Protegido com rate limiting (5 tentativas/minuto por IP)
 */
export async function resetPassword(formData: FormData): Promise<AuthResponse> {
  // Rate limiting por IP
  const ip = await getClientIP();
  const rateLimitResult = await checkRateLimit(`reset:${ip}`, RATE_LIMITS.login);

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return { error: `Muitas tentativas. Aguarde ${retryAfter} segundos.` };
  }

  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email e obrigatorio' };
  }

  // Normalizar email
  const normalizedEmail = email.toLowerCase().trim();

  // Sempre tentar enviar (mesmo que email nao exista)
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  // SEGURANCA: Sempre retornar sucesso para evitar enumeracao de usuarios
  // Nao revelar se o email existe ou nao no sistema
  return { success: true };
}

/**
 * Server Action para atualizar senha
 * SEGURANCA: Exige senha atual para prevenir alteracao por sessao roubada
 */
export async function updatePassword(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const currentPassword = formData.get('currentPassword') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // SEGURANCA: Exigir senha atual para alteracao de senha
  // Previne que atacante com sessao roubada altere a senha
  if (!currentPassword) {
    return { error: 'Senha atual e obrigatoria' };
  }

  if (!password) {
    return { error: 'Nova senha e obrigatoria' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas nao coincidem' };
  }

  // Validacao robusta de senha (8+ chars, maiuscula, minuscula, numero)
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] };
  }

  // Verificar usuario logado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: 'Usuario nao autenticado' };
  }

  // SEGURANCA: Verificar senha atual antes de permitir alteracao
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    // Mensagem generica para nao revelar detalhes
    return { error: 'Senha atual incorreta' };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: 'Erro ao atualizar senha' };
  }

  redirect('/');
}

/**
 * Server Action para definir nova senha (via link de recuperacao)
 * Usado quando usuario clica no link do email de reset
 * NAO exige senha atual - depende da sessao de recuperacao valida
 */
export async function setNewPassword(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password) {
    return { error: 'Nova senha e obrigatoria' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas nao coincidem' };
  }

  // Validacao robusta de senha
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors[0] };
  }

  // Verificar se ha sessao de recuperacao valida
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Sessao expirada. Solicite um novo link de recuperacao.' };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: 'Erro ao atualizar senha. Tente novamente.' };
  }

  return { success: true };
}
