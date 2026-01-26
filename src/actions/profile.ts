'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { UpdateProfileData } from '@/types/profile';
import { validateFileMagicBytes } from '@/lib/security';
import { verifyLinkSafety } from '@/lib/ai/verify-link';
import { checkAndCompleteProfileTasks } from '@/actions/engagement';

/**
 * Atualizar perfil do usuário
 */
export async function updateProfile(data: UpdateProfileData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar segurança do link se foi fornecido
    if (data.website_url) {
      const linkVerification = await verifyLinkSafety(data.website_url);
      if (!linkVerification.isSafe) {
        const categoryMessages: Record<string, string> = {
          spam: 'O link parece ser spam ou marketing agressivo.',
          phishing: 'O link parece ser uma tentativa de phishing.',
          malware: 'O link pode conter malware ou downloads suspeitos.',
          adult: 'O link parece conter conteúdo adulto.',
          suspicious: 'O link possui características suspeitas.',
        };
        const message = categoryMessages[linkVerification.category] || 'Link não permitido.';
        return { error: `Link não permitido: ${message}` };
      }
    }

    // Buscar perfil anterior para comparar e dar recompensas
    const { data: previousProfile } = await supabase
      .from('users')
      .select('full_name, bio, avatar_url, instagram_handle, tiktok_handle, youtube_handle, twitter_handle, website_url')
      .eq('id', user.id)
      .single();

    const { error } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return { error: 'Erro ao atualizar perfil' };
    }

    // Verificar e completar tarefas de perfil (dar corações)
    const heartsEarned = await checkAndCompleteProfileTasks(data, previousProfile || undefined);

    revalidatePath('/profile');
    revalidatePath('/perfil');
    revalidatePath('/dashboard');
    return { success: true, hearts: heartsEarned };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar perfil atual do usuário
 */
export async function getCurrentProfile() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Buscar estatisticas do usuário
 */
export async function getProfileStats() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Buscar estatisticas dos posts
    const { data: posts } = await supabase
      .from('posts')
      .select('id, status, likes_count')
      .eq('user_id', user.id);

    const allPosts = posts || [];
    const approvedPosts = allPosts.filter((p) => p.status === 'approved');
    const totalLikes = approvedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

    return {
      total_posts: allPosts.length,
      approved_posts: approvedPosts.length,
      total_likes: totalLikes,
    };
  } catch {
    return null;
  }
}

/**
 * Buscar perfil público de um usuário
 */
export async function getPublicProfile(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, bio, instagram_handle, tiktok_handle, youtube_handle, twitter_handle, website_url, role, is_creator, created_at')
      .eq('id', userId)
      .single();

    if (error) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Upload de avatar do usuário
 */
export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean;
  error: string | null;
  url?: string;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'Nenhum arquivo enviado' };
  }

  // Validar tipo de arquivo usando magic bytes
  const validation = await validateFileMagicBytes(file, ['png', 'jpeg', 'webp']);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error || 'Tipo de arquivo não suportado. Use PNG, JPEG ou WebP.'
    };
  }

  // Validar tamanho (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'Arquivo muito grande. Máximo 2MB.' };
  }

  // Upload para o storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Erro no upload do avatar:', uploadError);
    return { success: false, error: 'Erro ao fazer upload da imagem' };
  }

  // Obter URL pública
  const { data: publicUrl } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const avatarUrl = publicUrl.publicUrl;

  // Atualizar perfil do usuário
  const { error: updateError } = await supabase
    .from('users')
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Erro ao salvar URL do avatar:', updateError);
    return { success: false, error: 'Erro ao salvar avatar no perfil' };
  }

  // Revalidar páginas
  revalidatePath('/perfil');
  revalidatePath('/perfil/editar');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');

  return { success: true, error: null, url: avatarUrl };
}

/**
 * Remover avatar do usuário (volta ao padrão)
 */
export async function removeAvatar(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  // Limpar avatar_url no perfil
  const { error } = await supabase
    .from('users')
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Erro ao remover avatar' };
  }

  // Revalidar páginas
  revalidatePath('/perfil');
  revalidatePath('/perfil/editar');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');

  return { success: true, error: null };
}
