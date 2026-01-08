'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';

/**
 * Buscar todas as configurações do site (para página de admin)
 */
export async function fetchAllSiteSettings(): Promise<{
  data: SiteSetting[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  // Verificar se o usuário é admin/creator
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_creator) {
    return { data: null, error: 'Acesso negado. Apenas administradores podem ver as configurações.' };
  }

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key');

  if (error) {
    console.error('[Settings] Erro ao buscar configurações:', error);
    return { data: null, error: 'Erro ao buscar configurações' };
  }

  return { data: data as SiteSetting[], error: null };
}

/**
 * Atualizar uma configuração do site
 */
export async function updateSiteSetting(
  key: SiteSettingKey,
  value: string
): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  // Verificar se o usuário é admin/creator
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_creator) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem editar configurações.' };
  }

  const { error } = await supabase
    .from('site_settings')
    .update({ value })
    .eq('key', key);

  if (error) {
    console.error('[Settings] Erro ao atualizar configuração:', error);
    return { success: false, error: 'Erro ao atualizar configuração' };
  }

  // Revalidar todas as páginas que usam configurações
  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-nextlover');
  revalidatePath('/admin/configuracoes');

  return { success: true, error: null };
}

/**
 * Atualizar múltiplas configurações de uma vez
 */
export async function updateMultipleSiteSettings(
  settings: { key: SiteSettingKey; value: string }[]
): Promise<{
  success: boolean;
  error: string | null;
  updated: number;
}> {
  const supabase = await createClient();

  // Verificar se o usuário é admin/creator
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado', updated: 0 };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_creator) {
    return { success: false, error: 'Acesso negado. Apenas administradores podem editar configurações.', updated: 0 };
  }

  let updatedCount = 0;
  const errors: string[] = [];

  // Atualizar cada configuração
  for (const setting of settings) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value: setting.value })
      .eq('key', setting.key);

    if (error) {
      errors.push(`Erro ao atualizar '${setting.key}': ${error.message}`);
    } else {
      updatedCount++;
    }
  }

  // Revalidar todas as páginas que usam configurações
  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-nextlover');
  revalidatePath('/admin/configuracoes');

  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join('; '),
      updated: updatedCount,
    };
  }

  return { success: true, error: null, updated: updatedCount };
}

/**
 * Resetar uma configuração para o valor padrão
 */
export async function resetSiteSetting(key: SiteSettingKey): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  // Verificar se o usuário é admin/creator
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_creator) {
    return { success: false, error: 'Acesso negado' };
  }

  // Buscar valor padrão do banco (a migration tem os valores originais)
  // Por enquanto, deletar força o uso do DEFAULT_VALUES
  const { error } = await supabase
    .from('site_settings')
    .delete()
    .eq('key', key);

  if (error) {
    console.error('[Settings] Erro ao resetar configuração:', error);
    return { success: false, error: 'Erro ao resetar configuração' };
  }

  revalidatePath('/', 'layout');

  return { success: true, error: null };
}
