'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Tipos para respostas das actions
type AuthResponse = {
  error?: string;
  success?: boolean;
};

/**
 * Server Action para login com email e senha
 */
export async function login(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validação básica
  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Mensagens de erro amigáveis em português
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email ou senha incorretos' };
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Por favor, confirme seu email antes de fazer login' };
    }
    return { error: 'Erro ao fazer login. Tente novamente.' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

/**
 * Server Action para registro de novo usuário
 * Apenas emails aprovados no NPS podem se registrar
 */
export async function register(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validações
  if (!name || !email || !password) {
    return { error: 'Todos os campos são obrigatórios' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres' };
  }

  // Verificar se o email foi aprovado no NPS
  const { data: approvedLead } = await supabase
    .from('nps_leads')
    .select('id, name, status')
    .eq('email', email.toLowerCase())
    .eq('status', 'approved')
    .single();

  if (!approvedLead) {
    return {
      error: 'Este email não está autorizado para cadastro. Por favor, preencha o formulário de inscrição primeiro e aguarde aprovação.'
    };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Este email já está cadastrado' };
    }
    return { error: 'Erro ao criar conta. Tente novamente.' };
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
 * Server Action para recuperação de senha
 */
export async function resetPassword(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email é obrigatório' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: 'Erro ao enviar email de recuperação' };
  }

  return { success: true };
}

/**
 * Server Action para atualizar senha
 */
export async function updatePassword(formData: FormData): Promise<AuthResponse> {
  const supabase = await createClient();

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password) {
    return { error: 'Nova senha é obrigatória' };
  }

  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem' };
  }

  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres' };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: 'Erro ao atualizar senha' };
  }

  redirect('/dashboard');
}
