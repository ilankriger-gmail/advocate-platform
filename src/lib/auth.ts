/**
 * Utilitarios de autenticacao e autorizacao
 * Centraliza a logica de verificacao de permissoes para admin/creator
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Dados do perfil do usuario autenticado
 */
export interface UserProfile {
  id: string;
  role: string;
  is_creator: boolean;
}

/**
 * Resultado de autenticacao bem-sucedida
 * Inclui o usuario autenticado, seus dados de perfil e o cliente Supabase para uso posterior
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
 * Retorna ou os dados do usuario autenticado ou um erro
 */
export type AuthResponse = AuthResult | AuthError;

/**
 * Type guard para verificar se o resultado e um erro
 */
export function isAuthError(response: AuthResponse): response is AuthError {
  return 'error' in response;
}

/**
 * Funcao base de autenticacao
 * Retorna o usuario autenticado com seus dados de perfil ou erro
 * Esta funcao NAO verifica permissoes, apenas autentica o usuario
 *
 * @returns AuthResult com usuario, perfil e cliente Supabase, ou AuthError
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
    return { error: 'Usuario nao autenticado' };
  }

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Perfil de usuario nao encontrado' };
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
