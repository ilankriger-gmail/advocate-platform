'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';

/**
 * Server Action para login de admin
 *
 * Autentica via Supabase Auth e verifica se o usuario tem role='admin' no banco de dados.
 * Cria uma sessao segura gerenciada pelo Supabase Auth.
 *
 * @param formData - FormData contendo email e password
 * @returns ActionResponse com erro ou redireciona para /admin
 *
 * @example
 * // Em um formulario client-side
 * <form action={adminLogin}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 *   <button type="submit">Login</button>
 * </form>
 */
export async function adminLogin(formData: FormData): Promise<ActionResponse> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validacao basica
  if (!email || !password) {
    return { error: 'Email e senha sao obrigatorios' };
  }

  // Autenticar via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // Mensagens de erro amigaveis em portugues
    if (authError?.message.includes('Invalid login credentials')) {
      return { error: 'Email ou senha incorretos' };
    }
    if (authError?.message.includes('Email not confirmed')) {
      return { error: 'Por favor, confirme seu email antes de fazer login' };
    }
    return { error: 'Erro ao fazer login. Tente novamente.' };
  }

  // Verificar se o usuario tem role='admin' na tabela profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    // Se houver erro ao buscar perfil, fazer logout e retornar erro
    await supabase.auth.signOut();
    return { error: 'Erro ao verificar permissoes do usuario' };
  }

  // Verificar se o usuario e admin
  if (profile.role !== 'admin') {
    // Usuario nao e admin, fazer logout e retornar erro
    await supabase.auth.signOut();
    return { error: 'Acesso nao autorizado. Apenas administradores podem acessar esta area.' };
  }

  // Usuario e admin, revalidar cache e redirecionar
  revalidatePath('/', 'layout');
  redirect('/admin');
}

/**
 * Server Action para logout de admin
 *
 * Encerra a sessao do Supabase Auth e redireciona para a pagina de login admin.
 *
 * @example
 * // Em um botao client-side
 * <form action={adminLogout}>
 *   <button type="submit">Logout</button>
 * </form>
 */
export async function adminLogout(): Promise<void> {
  const supabase = await createClient();

  // Encerrar a sessao do Supabase Auth
  await supabase.auth.signOut();

  // Revalidar cache
  revalidatePath('/', 'layout');

  // Redirecionar para a pagina de login admin
  redirect('/admin/login');
}
