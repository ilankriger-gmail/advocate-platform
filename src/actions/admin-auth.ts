'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import type { ActionResponse } from './types';

/**
 * Tipo de resposta para ações de autenticação admin
 */
type AdminAuthResponse = ActionResponse<{
  authenticated?: boolean;
}>;

/**
 * Nome do cookie de sessão admin
 */
const ADMIN_SESSION_COOKIE = 'admin_session';

/**
 * Duração da sessão em milissegundos (24 horas)
 */
const SESSION_DURATION = 24 * 60 * 60 * 1000;

/**
 * Server Action para login de admin
 *
 * Valida credenciais contra variáveis de ambiente usando bcrypt
 * e cria uma sessão segura via cookie HTTP-only
 *
 * @param formData - FormData contendo username e password
 * @returns ActionResponse com resultado da autenticação
 */
export async function adminLogin(formData: FormData): Promise<AdminAuthResponse> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Validação básica
  if (!username || !password) {
    return { error: 'Usuário e senha são obrigatórios' };
  }

  // Obter credenciais das variáveis de ambiente
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  // Verificar se as variáveis de ambiente estão configuradas
  if (!adminUsername || !adminPasswordHash) {
    return {
      error: 'Configuração de admin não encontrada. Verifique as variáveis de ambiente.',
    };
  }

  // Validar username
  if (username !== adminUsername) {
    // Delay para prevenir timing attacks
    await new Promise(resolve => setTimeout(resolve, 500));
    return { error: 'Usuário ou senha incorretos' };
  }

  // Validar senha com bcrypt
  try {
    const isValidPassword = await bcrypt.compare(password, adminPasswordHash);

    if (!isValidPassword) {
      // Delay para prevenir timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return { error: 'Usuário ou senha incorretos' };
    }
  } catch (error) {
    return {
      error: 'Erro ao validar credenciais. Verifique a configuração do hash de senha.',
    };
  }

  // Criar sessão
  const session = {
    authenticated: true,
    username: adminUsername,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
  };

  // Salvar sessão em cookie HTTP-only
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // em segundos
    path: '/',
  });

  // Revalidar layout e redirecionar
  revalidatePath('/', 'layout');
  redirect('/admin');
}

/**
 * Server Action para logout de admin
 *
 * Remove o cookie de sessão e redireciona para a página de login
 */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();

  // Remover cookie de sessão
  cookieStore.delete(ADMIN_SESSION_COOKIE);

  // Revalidar layout e redirecionar
  revalidatePath('/', 'layout');
  redirect('/admin/login');
}

/**
 * Verifica se existe uma sessão admin válida
 *
 * Verifica o cookie de sessão e valida:
 * - Se o cookie existe
 * - Se a sessão não expirou (24h)
 * - Se os dados da sessão são válidos
 *
 * @returns boolean indicando se o admin está autenticado
 */
export async function checkAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  // Verificar se o cookie existe
  if (!sessionCookie?.value) {
    return false;
  }

  try {
    // Parse da sessão
    const session = JSON.parse(sessionCookie.value);

    // Validar estrutura da sessão
    if (!session.authenticated || !session.expiresAt) {
      return false;
    }

    // Verificar expiração
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();

    if (now > expiresAt) {
      // Sessão expirada - remover cookie
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return false;
    }

    // Sessão válida
    return true;
  } catch (error) {
    // Cookie malformado ou erro no parse - remover
    cookieStore.delete(ADMIN_SESSION_COOKIE);
    return false;
  }
}

/**
 * Obtém os dados da sessão admin atual
 *
 * @returns Dados da sessão ou null se não autenticado
 */
export async function getAdminSession(): Promise<{
  username: string;
  loginTime: string;
  expiresAt: string;
} | null> {
  const isAuthenticated = await checkAdminSession();

  if (!isAuthenticated) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return {
      username: session.username,
      loginTime: session.loginTime,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    return null;
  }
}
