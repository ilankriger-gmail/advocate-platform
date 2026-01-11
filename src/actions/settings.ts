'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { SiteSetting, SiteSettingKey } from '@/lib/config/site';
import { logger, sanitizeError } from '@/lib';
import { validateFileMagicBytes } from '@/lib/security';

// Logger contextualizado para o módulo de settings
const settingsLogger = logger.withContext('[Settings]');

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
    settingsLogger.error('Erro ao buscar configurações', { error: sanitizeError(error) });
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
    settingsLogger.error('Erro ao atualizar configuração', { error: sanitizeError(error) });
    return { success: false, error: 'Erro ao atualizar configuração' };
  }

  // Revalidar todas as páginas que usam configurações
  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-arena');
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

  // Atualizar ou criar cada configuração
  for (const setting of settings) {
    const { error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key: setting.key,
          value: setting.value,
          label: setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: '',
          field_type: 'text',
        },
        { onConflict: 'key' }
      );

    if (error) {
      errors.push(`Erro ao atualizar '${setting.key}': ${error.message}`);
    } else {
      updatedCount++;
    }
  }

  // Revalidar todas as páginas que usam configurações
  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-arena');
  revalidatePath('/admin/configuracoes');
  revalidatePath('/admin/emails');

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
 * Upload de favicon
 */
export async function uploadFavicon(formData: FormData): Promise<{
  success: boolean;
  error: string | null;
  url?: string;
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

  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado' };
  }

  // Validar tipo de arquivo usando magic bytes (conteúdo real)
  // Não confiar em file.type que pode ser manipulado pelo cliente
  const validation = await validateFileMagicBytes(file, ['svg', 'png', 'ico']);
  if (!validation.valid) {
    // Mensagens de erro específicas e claras para o usuário
    const fileName = file.name.length > 30
      ? `${file.name.substring(0, 27)}...`
      : file.name;

    // Determinar mensagem baseada no tipo de erro
    let errorMessage: string;

    if (validation.error?.includes('SVG inválido') || validation.error?.includes('malicioso')) {
      errorMessage = `"${fileName}": Arquivo SVG contém conteúdo inválido ou inseguro. Por favor, use um arquivo SVG limpo.`;
    } else if (validation.error?.includes('não reconhecido') || validation.error?.includes('inválido')) {
      errorMessage = `"${fileName}": Tipo de arquivo não suportado. Use apenas: SVG, PNG ou ICO.`;
    } else if (validation.error?.includes('muito pequeno')) {
      errorMessage = `"${fileName}": Arquivo corrompido ou muito pequeno para ser uma imagem válida.`;
    } else if (validation.error?.includes('não é permitido')) {
      errorMessage = `"${fileName}": ${validation.error}`;
    } else {
      errorMessage = `"${fileName}": ${validation.error || 'Arquivo inválido'}. Formatos aceitos: SVG, PNG e ICO.`;
    }

    return { success: false, error: errorMessage };
  }

  // Validar tamanho (max 500KB)
  if (file.size > 500 * 1024) {
    const fileName = file.name.length > 30
      ? `${file.name.substring(0, 27)}...`
      : file.name;
    return { success: false, error: `"${fileName}": Arquivo muito grande. Máximo 500KB.` };
  }

  // Upload para o storage
  const fileExt = file.name.split('.').pop();
  const fileName = `favicon-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    settingsLogger.error('Erro no upload do favicon', { error: sanitizeError(uploadError) });
    return { success: false, error: 'Erro ao fazer upload do favicon' };
  }

  // Obter URL pública
  const { data: publicUrl } = supabase.storage
    .from('site-assets')
    .getPublicUrl(fileName);

  const faviconUrl = publicUrl.publicUrl;

  // Salvar URL na configuração
  const { error: updateError } = await supabase
    .from('site_settings')
    .upsert({
      key: 'favicon_url',
      value: faviconUrl,
      label: 'Favicon URL',
      description: 'URL do favicon do site',
      field_type: 'text',
    }, { onConflict: 'key' });

  if (updateError) {
    settingsLogger.error('Erro ao salvar URL do favicon', { error: sanitizeError(updateError) });
    return { success: false, error: 'Erro ao salvar configuração do favicon' };
  }

  // Revalidar
  revalidatePath('/', 'layout');
  revalidatePath('/admin/configuracoes');

  return { success: true, error: null, url: faviconUrl };
}

/**
 * Resetar favicon para o padrão
 */
export async function resetFavicon(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

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

  // Remover configuração do favicon (volta ao padrão)
  await supabase
    .from('site_settings')
    .delete()
    .eq('key', 'favicon_url');

  revalidatePath('/', 'layout');
  revalidatePath('/admin/configuracoes');

  return { success: true, error: null };
}

/**
 * Upload de logo
 */
export async function uploadLogo(formData: FormData): Promise<{
  success: boolean;
  error: string | null;
  url?: string;
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

  const file = formData.get('file') as File;

  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado' };
  }

  // Validar tipo de arquivo usando magic bytes (conteúdo real)
  // Não confiar em file.type que pode ser manipulado pelo cliente
  const validation = await validateFileMagicBytes(file, ['png', 'jpeg', 'webp', 'svg']);
  if (!validation.valid) {
    // Mensagens de erro específicas e claras para o usuário
    const fileName = file.name.length > 30
      ? `${file.name.substring(0, 27)}...`
      : file.name;

    // Determinar mensagem baseada no tipo de erro
    let errorMessage: string;

    if (validation.error?.includes('SVG inválido') || validation.error?.includes('malicioso')) {
      errorMessage = `"${fileName}": Arquivo SVG contém conteúdo inválido ou inseguro. Por favor, use um arquivo SVG limpo.`;
    } else if (validation.error?.includes('não reconhecido') || validation.error?.includes('inválido')) {
      errorMessage = `"${fileName}": Tipo de arquivo não suportado. Use apenas: PNG, JPEG, WebP ou SVG.`;
    } else if (validation.error?.includes('muito pequeno')) {
      errorMessage = `"${fileName}": Arquivo corrompido ou muito pequeno para ser uma imagem válida.`;
    } else if (validation.error?.includes('não é permitido')) {
      errorMessage = `"${fileName}": ${validation.error}`;
    } else {
      errorMessage = `"${fileName}": ${validation.error || 'Arquivo inválido'}. Formatos aceitos: PNG, JPEG, WebP e SVG.`;
    }

    return { success: false, error: errorMessage };
  }

  // Validar tamanho (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    const fileName = file.name.length > 30
      ? `${file.name.substring(0, 27)}...`
      : file.name;
    return { success: false, error: `"${fileName}": Arquivo muito grande. Máximo 2MB.` };
  }

  // Upload para o storage
  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    settingsLogger.error('Erro no upload da logo', { error: sanitizeError(uploadError) });
    return { success: false, error: 'Erro ao fazer upload da logo' };
  }

  // Obter URL pública
  const { data: publicUrl } = supabase.storage
    .from('site-assets')
    .getPublicUrl(fileName);

  const logoUrl = publicUrl.publicUrl;

  // Salvar URL na configuração
  const { error: updateError } = await supabase
    .from('site_settings')
    .upsert({
      key: 'logo_url',
      value: logoUrl,
      label: 'Logo URL',
      description: 'URL da logo do site',
      field_type: 'text',
    }, { onConflict: 'key' });

  if (updateError) {
    settingsLogger.error('Erro ao salvar URL da logo', { error: sanitizeError(updateError) });
    return { success: false, error: 'Erro ao salvar configuração da logo' };
  }

  // Revalidar
  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-arena');
  revalidatePath('/admin/configuracoes');

  return { success: true, error: null, url: logoUrl };
}

/**
 * Resetar logo para o padrão
 */
export async function resetLogo(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

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

  // Remover configuração da logo (volta ao padrão)
  await supabase
    .from('site_settings')
    .delete()
    .eq('key', 'logo_url');

  revalidatePath('/', 'layout');
  revalidatePath('/login');
  revalidatePath('/seja-arena');
  revalidatePath('/admin/configuracoes');

  return { success: true, error: null };
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
    settingsLogger.error('Erro ao resetar configuração', { error: sanitizeError(error) });
    return { success: false, error: 'Erro ao resetar configuração' };
  }

  revalidatePath('/', 'layout');

  return { success: true, error: null };
}
