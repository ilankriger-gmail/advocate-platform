'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { CreatePostData } from '@/types/post';
import type { Post, PostComment } from '@/lib/supabase/types';

/**
 * Criar novo post
 */
export async function createPost(data: CreatePostData): Promise<ActionResponse<Post>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: data.title,
        content: data.content,
        media_url: data.media_url ? [data.media_url] : null,
        type: data.type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { error: 'Erro ao criar post' };
    }

    revalidatePath('/feed');
    revalidatePath('/dashboard');
    return { success: true, data: post };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar post (apenas admin)
 */
export async function approvePost(postId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('posts')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      return { error: 'Erro ao aprovar post' };
    }

    revalidatePath('/feed');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Rejeitar post (apenas admin)
 */
export async function rejectPost(postId: string, reason: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('posts')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      return { error: 'Erro ao rejeitar post' };
    }

    revalidatePath('/feed');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Curtir post
 */
export async function likePost(postId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se já curtiu
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remover like
      await supabase
        .from('post_likes')
        .delete()
        .eq('id', existing.id);

      // Decrementar contador
      await supabase.rpc('decrement_likes', { post_id: postId });
    } else {
      // Adicionar like
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      // Incrementar contador
      await supabase.rpc('increment_likes', { post_id: postId });
    }

    revalidatePath('/feed');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Comentar em post
 */
export async function commentPost(postId: string, content: string): Promise<ActionResponse<PostComment>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    if (!content.trim()) {
      return { error: 'Comentário não pode ser vazio' };
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return { error: 'Erro ao adicionar comentário' };
    }

    // Incrementar contador de comentários
    await supabase
      .from('posts')
      .update({ comments_count: supabase.rpc('increment') })
      .eq('id', postId);

    revalidatePath('/feed');
    return { success: true, data: comment };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Deletar post (próprio)
 */
export async function deletePost(postId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      return { error: 'Erro ao deletar post' };
    }

    revalidatePath('/feed');
    revalidatePath('/profile');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar comentários de um post
 */
export async function getPostComments(postId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:users!post_comments_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch {
    return [];
  }
}
