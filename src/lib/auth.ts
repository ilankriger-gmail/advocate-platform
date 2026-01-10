/**
 * Utilitarios de autenticacao e autorizacao
 * Centraliza a logica de verificação de permissoes para admin/creator
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dados do perfil do usuário autenticado
 */
export interface UserProfile {
  id: string;
  role: string;
  is_creator: boolean;
}

/**
 * Resultado de autenticacao bem-sucedida
 * Inclui o usuário autenticado, seus dados de perfil e o cliente Supabase para uso posterior
 */
export interface AuthResult {
  user: {
    id: string;
  };
  profile: UserProfile;
  supabase: SupabaseClient;
}

/**
 * Erro de autenticacao/autorizacao
 */
export interface AuthError {
  error: string;
}

/**
 * Tipo de retorno das funcoes de autorizacao
 * Retorna ou os dados do usuário autenticado ou um erro
 */
export type AuthResponse = AuthResult | AuthError;

/**
 * Type guard para verificar se o resultado e um erro
 */
export function isAuthError(response: AuthResponse): response is AuthError {
  return 'error' in response;
}

/**
 * Função base de autenticacao
 * Retorna o usuário autenticado com seus dados de perfil ou erro
 * Esta função NAO verifica permissoes, apenas autentica o usuário
 *
 * @returns AuthResult com usuário, perfil e cliente Supabase, ou AuthError
 *
 * @example
 * const auth = await requireAuth();
 * if (isAuthError(auth)) {
 *   return auth; // retorna o erro
 * }
 * // usar auth.user, auth.profile, auth.supabase
 */
export async function requireAuth(): Promise<AuthResponse> {
  const supabase = await createClient();

  // Verificar autenticacao
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Usuário não autenticado' };
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('users')
    .select('id, role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Perfil de usuário não encontrado' };
  }

  return {
    user: {
      id: user.id,
    },
    profile: {
      id: profile.id,
      role: profile.role,
      is_creator: profile.is_creator,
    },
    supabase,
  };
}

/**
 * Verifica se o usuário autenticado tem permissoes de admin OU creator
 * Esta e a função de autorizacao mais comum usada em 16+ lugares
 * Retorna o usuário autenticado com seus dados de perfil ou erro
 *
 * @returns AuthResult com usuário, perfil e cliente Supabase, ou AuthError
 *
 * @example
 * const auth = await requireAdminOrCreator();
 * if (isAuthError(auth)) {
 *   return auth; // retorna o erro
 * }
 * // usuário e admin ou creator, pode prosseguir
 * // usar auth.user, auth.profile, auth.supabase
 */
export async function requireAdminOrCreator(): Promise<AuthResponse> {
  // Primeiro autentica o usuário
  const auth = await requireAuth();

  // Se houve erro na autenticacao, retorna o erro
  if (isAuthError(auth)) {
    return auth;
  }

  // Verifica se tem permissao de admin ou creator
  if (auth.profile.role !== 'admin' && !auth.profile.is_creator) {
    return { error: 'Acesso não autorizado' };
  }

  // Usuário tem permissao, retorna os dados
  return auth;
}

/**
 * Verifica se o usuário autenticado tem permissoes de admin APENAS
 * Esta função e usada em 5 lugares onde e necessario acesso exclusivo de admin
 * Retorna o usuário autenticado com seus dados de perfil ou erro
 *
 * @returns AuthResult com usuário, perfil e cliente Supabase, ou AuthError
 *
 * @example
 * const auth = await requireAdmin();
 * if (isAuthError(auth)) {
 *   return auth; // retorna o erro
 * }
 * // usuário e admin, pode prosseguir
 * // usar auth.user, auth.profile, auth.supabase
 */
export async function requireAdmin(): Promise<AuthResponse> {
  // Primeiro autentica o usuário
  const auth = await requireAuth();

  // Se houve erro na autenticacao, retorna o erro
  if (isAuthError(auth)) {
    return auth;
  }

  // Verifica se tem permissao de admin
  if (auth.profile.role !== 'admin') {
    return { error: 'Acesso não autorizado' };
  }

  // Usuário tem permissao, retorna os dados
  return auth;
}
