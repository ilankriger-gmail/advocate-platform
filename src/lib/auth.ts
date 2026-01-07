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
