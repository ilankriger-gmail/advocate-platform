'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PostWithAuthor } from '@/types/post';
import { logger, sanitizeError } from '@/lib';
import { giveHearts } from '@/lib/hearts';

// Logger contextualizado para o módulo de saves
const savesLogger = logger.withContext('[Saves]');

/**
 * Salvar um post nos favoritos do usuário
 */
export async function savePost(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase.from('post_saves').insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    // Se já existe, não é erro
    if (error.code === '23505') {
      return { success: true, saved: true };
    }
    savesLogger.error('Erro ao salvar post', { error: sanitizeError(error) });
    return { success: false, error: 'Erro ao salvar post' };
  }

  // ❤️ Dar coração por salvar post
  await giveHearts(user.id, 'SAVE_POST', {
    referenceId: postId,
    referenceType: 'post_save',
    description: 'salvou um post'
  });

  revalidatePath('/');
  return { success: true, saved: true };
}

/**
 * Remover um post dos favoritos do usuário
 */
export async function unsavePost(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase
    .from('post_saves')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    savesLogger.error('Erro ao remover save', { error: sanitizeError(error) });
    return { success: false, error: 'Erro ao remover save' };
  }

  revalidatePath('/');
  revalidatePath('/perfil/salvos');
  return { success: true, saved: false };
}

/**
 * Alternar save/unsave de um post
 */
export async function toggleSavePost(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado', saved: false };
  }

  // Verificar se já está salvo
  const { data: existingSave } = await supabase
    .from('post_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existingSave) {
    return unsavePost(postId);
  } else {
    return savePost(postId);
  }
}

/**
 * Verificar se um post está salvo pelo usuário atual
 */
export async function isPostSaved(postId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('post_saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  return !!data;
}

/**
 * Buscar posts salvos do usuário atual
 */
export async function getSavedPosts(limit = 20, cursor?: string): Promise<{
  posts: PostWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  let query = supabase
    .from('post_saves')
    .select(`
      created_at,
      post:posts(
        *,
        author:users!posts_user_id_fkey(
          id,
          full_name,
          avatar_url,
          is_creator
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    savesLogger.error('Erro ao buscar posts salvos', { error: sanitizeError(error) });
    return { posts: [], nextCursor: null, hasMore: false };
  }

  // Extrair posts do resultado
  const posts = (data || [])
    .map((item) => (item.post as unknown) as PostWithAuthor | null)
    .filter((post): post is PostWithAuthor => post !== null);

  const hasMore = posts.length === limit;
  const nextCursor = hasMore && data && data.length > 0
    ? data[data.length - 1].created_at
    : null;

  return { posts, nextCursor, hasMore };
}

/**
 * Registrar compartilhamento de um post
 */
export async function sharePost(postId: string, platform: string = 'copy_link') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('post_shares').insert({
    post_id: postId,
    user_id: user?.id || null,
    platform,
  });

  if (error) {
    savesLogger.error('Erro ao registrar share', { error: sanitizeError(error) });
    return { success: false };
  }

  return { success: true };
}
