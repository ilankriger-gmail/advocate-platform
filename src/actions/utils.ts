'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from './types';

/**
 * Verifica se o usuário é admin ou creator
 *
 * @param userId - ID do usuário a ser verificado
 * @returns ActionResponse com sucesso ou erro de autorização
 *
 * @example
 * const authCheck = await verifyAdminOrCreator(user.id);
 * if (authCheck.error) {
 *   return authCheck;
 * }
 */
export async function verifyAdminOrCreator(
  userId: string
): Promise<ActionResponse<{ role: string; is_creator: boolean }>> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { error: 'Erro ao verificar permissões do usuário' };
  }

  if (profile.role !== 'admin' && !profile.is_creator) {
    return { error: 'Acesso não autorizado' };
  }

  return { success: true, data: profile };
}

/**
 * Verifica se o usuário é admin
 *
 * @param userId - ID do usuário a ser verificado
 * @returns ActionResponse com sucesso ou erro de autorização
 *
 * @example
 * const authCheck = await verifyAdmin(user.id);
 * if (authCheck.error) {
 *   return authCheck;
 * }
 */
export async function verifyAdmin(
  userId: string
): Promise<ActionResponse<{ role: string }>> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { error: 'Erro ao verificar permissões do usuário' };
  }

  if (profile.role !== 'admin') {
    return { error: 'Acesso não autorizado' };
  }

  return { success: true, data: profile };
}

/**
 * Obtém o usuário autenticado
 *
 * @returns ActionResponse com dados do usuário ou erro de autenticação
 *
 * @example
 * const userCheck = await getAuthenticatedUser();
 * if (userCheck.error) {
 *   return userCheck;
 * }
 * const user = userCheck.data;
 */
export async function getAuthenticatedUser(): Promise<
  ActionResponse<{ id: string; email?: string }>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'Usuário não autenticado' };
  }

  return { success: true, data: user };
}
