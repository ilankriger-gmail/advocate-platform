'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { CreatePostData, UpdatePostData } from '@/types/post';
import type { Post, PostComment } from '@/lib/supabase/types';
import { moderatePost, getBlockedMessage, getPendingReviewMessage } from '@/lib/moderation';

/**
 * Remove links clicáveis do HTML, mantendo apenas o texto
 * Usado para posts de usuários da comunidade (não-criadores)
 */
function stripLinks(html: string): string {
  if (!html) return html;
  // Substitui <a href="...">texto</a> por apenas "texto"
  return html.replace(/<a\s+[^>]*>(.*?)<\/a>/gi, '$1');
}

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

    // Verificar se usuário existe na tabela users, senão criar
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_creator')
      .eq('id', user.id)
      .single();

    // Se usuário não existe, criar registro na tabela users
    if (userError && userError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          avatar_url: user.user_metadata?.avatar_url || null,
          is_creator: false,
        });

      if (insertError) {
        console.error('Erro ao criar usuário:', insertError);
        return { error: 'Erro ao criar perfil do usuário' };
      }
    }

    const isCreator = userData?.is_creator ?? false;
    console.log('createPost - userId:', user.id, 'isCreator:', isCreator, 'userData:', userData);

    // Só criadores podem usar YouTube e Instagram embeds
    if (!isCreator && (data.youtube_url || data.instagram_url)) {
      return { error: 'Apenas criadores podem adicionar embeds de YouTube e Instagram' };
    }

    // Remover links do conteúdo se não for criador (segurança adicional)
    const finalContent = isCreator
      ? (data.content || null)
      : stripLinks(data.content || '') || null;

    // ============================================
    // MODERAÇÃO AUTOMÁTICA COM IA
    // Sightengine (imagens) + Perspective API (texto)
    // ============================================
    let postStatus: 'approved' | 'pending' = isCreator ? 'approved' : 'pending';
    let moderationScore: number | null = null;
    let moderationFlags: Record<string, unknown> | null = null;
    let moderationMessage: string | null = null;

    // Executar moderação para todos os posts (incluindo criadores)
    try {
      const moderationResult = await moderatePost({
        title: data.title || '',
        content: finalContent || '',
        images: Array.isArray(data.media_url) ? data.media_url : data.media_url ? [data.media_url] : undefined,
      });

      moderationScore = moderationResult.overall_score;
      moderationFlags = {
        image: moderationResult.image_result?.flags || null,
        toxicity: moderationResult.toxicity_result?.scores || null,
      };

      console.log('[Moderation] Resultado:', {
        decision: moderationResult.decision,
        score: moderationScore,
        blocked_reasons: moderationResult.blocked_reasons,
      });

      // Aplicar decisão da moderação
      if (moderationResult.decision === 'blocked') {
        // Conteúdo bloqueado - não publicar
        return {
          error: getBlockedMessage(moderationResult.blocked_reasons),
        };
      } else if (moderationResult.decision === 'pending_review') {
        // Precisa revisão manual - mesmo criadores
        postStatus = 'pending';
        moderationMessage = getPendingReviewMessage();
      }
      // Se 'approved', mantém o status original (approved para criadores, pending para comunidade)

    } catch (moderationError) {
      // Em caso de erro na moderação, continua com fluxo normal
      console.error('[Moderation] Erro:', moderationError);
    }

    console.log('createPost - postStatus:', postStatus);

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title: data.title || '',  // Título opcional para YouTube/Instagram
        content: finalContent,
        media_url: data.media_url || null,
        media_type: data.media_type || 'none',
        youtube_url: data.youtube_url || null,
        instagram_url: data.instagram_url || null,
        type: data.type,
        status: postStatus,
        moderation_score: moderationScore,
        moderation_flags: moderationFlags,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar post:', error);
      return { error: 'Erro ao criar post' };
    }

    // Registrar log de moderação
    if (moderationScore !== null) {
      await supabase.from('moderation_logs').insert({
        post_id: post.id,
        decision: postStatus === 'pending' ? 'pending_review' : 'approved',
        score: moderationScore,
        flags: moderationFlags || {},
      });
    }

    revalidatePath('/');
    revalidatePath('/feed');
    revalidatePath('/dashboard');
    revalidatePath('/perfil');

    // Retornar com mensagem de moderação se houver
    if (moderationMessage) {
      return { success: true, data: post, message: moderationMessage };
    }
    return { success: true, data: post };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Atualizar post existente
 */
export async function updatePost(data: UpdatePostData): Promise<ActionResponse<Post>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se o post pertence ao usuário
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', data.id)
      .single();

    if (!existingPost || existingPost.user_id !== user.id) {
      return { error: 'Você não tem permissão para editar este post' };
    }

    // Verificar se é criador para permitir embeds de YouTube/Instagram
    const { data: userData } = await supabase
      .from('users')
      .select('is_creator')
      .eq('id', user.id)
      .single();

    const isCreator = userData?.is_creator ?? false;

    // Só criadores podem usar YouTube e Instagram embeds
    if (!isCreator && (data.youtube_url || data.instagram_url)) {
      return { error: 'Apenas criadores podem adicionar embeds de YouTube e Instagram' };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    // Remover links do conteúdo se não for criador
    if (data.content !== undefined) {
      updateData.content = isCreator ? data.content : stripLinks(data.content);
    }
    if (data.media_url !== undefined) updateData.media_url = data.media_url;
    if (data.media_type !== undefined) updateData.media_type = data.media_type;
    if (data.youtube_url !== undefined) updateData.youtube_url = data.youtube_url;
    if (data.instagram_url !== undefined) updateData.instagram_url = data.instagram_url;

    const { data: post, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar post:', error);
      return { error: 'Erro ao atualizar post' };
    }

    revalidatePath('/feed');
    revalidatePath('/perfil');
    revalidatePath(`/perfil/posts/${data.id}`);
    return { success: true, data: post };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Upload de imagens para post
 */
export async function uploadPostImages(formData: FormData): Promise<ActionResponse<string[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return { error: 'Nenhuma imagem selecionada' };
    }

    if (files.length > 5) {
      return { error: 'Máximo de 5 imagens permitidas' };
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        return { error: 'Apenas imagens são permitidas' };
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { error: 'Imagem muito grande. Máximo 5MB' };
      }

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        // Mensagens mais específicas baseadas no erro
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          return { error: 'Bucket de imagens não configurado. Contate o administrador.' };
        }
        if (uploadError.message?.includes('policy') || uploadError.message?.includes('permission')) {
          return { error: 'Sem permissão para upload. Contate o administrador.' };
        }
        return { error: `Erro ao fazer upload: ${uploadError.message || 'erro desconhecido'}` };
      }

      // Obter URL pública
      const { data: publicUrl } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl.publicUrl);
    }

    return { success: true, data: uploadedUrls };
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
 * Votar em post (upvote/downvote)
 * @param voteType 1 = upvote, -1 = downvote, 0 = remover voto
 */
export async function votePost(postId: string, voteType: 1 | -1 | 0): Promise<ActionResponse<{ voteScore: number; userVote: number | null }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar voto existente
    const { data: existingVote } = await supabase
      .from('post_votes')
      .select('id, vote_type')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (voteType === 0) {
      // Remover voto
      if (existingVote) {
        await supabase
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);
      }
    } else if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Mesmo voto = remover (toggle)
        await supabase
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);
      } else {
        // Voto diferente = atualizar
        await supabase
          .from('post_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      }
    } else {
      // Novo voto
      await supabase
        .from('post_votes')
        .insert({
          post_id: postId,
          user_id: user.id,
          vote_type: voteType,
        });
    }

    // Buscar score atualizado e voto do usuário
    const [postResult, voteResult] = await Promise.all([
      supabase.from('posts').select('vote_score').eq('id', postId).single(),
      supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', user.id).single(),
    ]);

    revalidatePath('/feed');
    revalidatePath('/');
    return {
      success: true,
      data: {
        voteScore: postResult.data?.vote_score || 0,
        userVote: voteResult.data?.vote_type || null,
      },
    };
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
