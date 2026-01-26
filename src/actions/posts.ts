'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse, CreatePostResponse } from '@/types/action';
import type { CreatePostData, UpdatePostData } from '@/types/post';
import type { Post, PostComment } from '@/lib/supabase/types';
import { moderatePost, moderateText, getBlockedMessage, getPendingReviewMessage } from '@/lib/moderation';
import { logModerationAction, checkRateLimit, RATE_LIMITS, validateFileMagicBytes, sanitizeText } from '@/lib/security';
import { logger, maskId, sanitizeError } from '@/lib';
import { verifyAdminOrCreator } from './utils';
import { calculateSimilarity } from '@/lib/similarity';
import { notifyPostApproved, notifyPostRejected, notifyNewLike, notifyNewComment } from '@/actions/notifications';
import { giveHearts } from '@/lib/hearts';
import { autoResponderComentario, agendarAutoComentarioPost } from '@/actions/autoresponder';
import { checkBanOrError, recordSpamViolation } from '@/lib/spam-protection';

// Logger contextualizado para o módulo de posts
const postsLogger = logger.withContext('[Posts]');

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
export async function createPost(data: CreatePostData): Promise<CreatePostResponse<Post>> {
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
        postsLogger.error('Erro ao criar usuário', { error: sanitizeError(insertError) });
        return { error: 'Erro ao criar perfil do usuário' };
      }
    }

    const isCreator = userData?.is_creator ?? false;

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
    // Posts são aprovados automaticamente, só vão para moderação se houver problema
    // ============================================
    let postStatus: 'approved' | 'pending' | 'blocked' = 'approved';
    let moderationScore: number | null = null;
    let moderationFlags: Record<string, unknown> | null = null;
    let moderationMessage: string | null = null;
    let moderationDecision: 'approved' | 'pending_review' | 'blocked' = 'approved';
    let blockedReasons: string[] = [];
    let contentCategory: 'normal' | 'help_request' = 'normal';

    // Executar moderação para todos os posts (incluindo criadores)
    try {
      console.log('[MODERATION DEBUG] Iniciando moderação...');
      console.log('[MODERATION DEBUG] Título:', data.title);
      console.log('[MODERATION DEBUG] Conteúdo:', finalContent?.substring(0, 100));

      const moderationResult = await moderatePost({
        title: data.title || '',
        content: finalContent || '',
        images: Array.isArray(data.media_url) ? data.media_url : data.media_url ? [data.media_url] : undefined,
      });

      console.log('[MODERATION DEBUG] Resultado:', JSON.stringify(moderationResult, null, 2));

      moderationScore = moderationResult.overall_score;
      moderationFlags = {
        image: moderationResult.image_result?.flags || null,
        toxicity: moderationResult.toxicity_result?.scores || null,
        blocked_reasons: moderationResult.blocked_reasons,
      };
      moderationDecision = moderationResult.decision;
      blockedReasons = moderationResult.blocked_reasons;

      // Capturar categoria de conteúdo (normal ou help_request)
      contentCategory = moderationResult.content_category;

      console.log('[MODERATION DEBUG] Decision:', moderationDecision, 'Score:', moderationScore);

      postsLogger.debug('Resultado da moderação', {
        decision: moderationResult.decision,
        score: moderationScore,
        blocked_reasons: moderationResult.blocked_reasons,
        content_category: contentCategory,
      });

      // Aplicar decisão da moderação
      if (moderationResult.decision === 'blocked') {
        // Conteúdo bloqueado - salvar com status 'blocked' para revisão admin
        postStatus = 'blocked';
        moderationMessage = getBlockedMessage(moderationResult.blocked_reasons);
        console.log('[MODERATION DEBUG] Post BLOQUEADO! Mensagem:', moderationMessage);
      } else if (moderationResult.decision === 'pending_review') {
        // Precisa revisão manual - mesmo criadores
        postStatus = 'pending';
        moderationMessage = getPendingReviewMessage();
        console.log('[MODERATION DEBUG] Post em PENDING_REVIEW');
      } else {
        console.log('[MODERATION DEBUG] Post APPROVED');
      }
      // Se 'approved', mantém status approved (todos os posts são aprovados automaticamente)

    } catch (moderationError) {
      // Em caso de erro na moderação, continua com fluxo normal
      console.error('[MODERATION DEBUG] ERRO na moderação:', moderationError);
      postsLogger.error('Erro na moderação', { error: sanitizeError(moderationError) });
    }

    postsLogger.debug('Status do post após moderação', { postStatus });

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
        type: 'community', // Todos os posts são do tipo comunidade
        status: postStatus,
        moderation_score: moderationScore,
        moderation_flags: moderationFlags,
        content_category: contentCategory,
      })
      .select()
      .single();

    if (error) {
      postsLogger.error('Erro ao criar post', { error: sanitizeError(error) });
      return { error: 'Erro ao criar post' };
    }

    // Registrar log de moderação
    if (moderationScore !== null) {
      await supabase.from('moderation_logs').insert({
        post_id: post.id,
        decision: moderationDecision,
        score: moderationScore,
        flags: moderationFlags || {},
        blocked_reasons: blockedReasons,
      });
    }

    // ❤️ Dar coração por criar post (se aprovado)
    if (postStatus === 'approved') {
      await giveHearts(user.id, 'CREATE_POST', {
        referenceId: post.id,
        referenceType: 'post',
        description: 'criou um post'
      });

      // 🤖 Auto-comentário do Moço no post (67% de chance)
      const textoPost = `${data.title || ''} ${finalContent || ''}`.trim();
      agendarAutoComentarioPost(post.id, textoPost, user.id)
        .catch(err => postsLogger.error('Erro ao agendar auto-comentário', { error: sanitizeError(err) }));
    }

    revalidatePath('/');
    revalidatePath('/feed');
    revalidatePath('/dashboard');
    revalidatePath('/perfil');
    revalidatePath('/admin/moderacao');

    // Estrutura de resposta com informações de moderação
    const response: CreatePostResponse<Post> = {
      success: true,
      data: post,
      moderationStatus: moderationDecision,
      contentCategory,
    };

    // Adicionar mensagem e razões se bloqueado
    if (postStatus === 'blocked') {
      response.message = moderationMessage || undefined;
      response.blockedReasons = blockedReasons;
    } else if (moderationMessage) {
      response.message = moderationMessage;
    }

    // Mensagem especial para help_request
    if (contentCategory === 'help_request' && postStatus !== 'blocked') {
      response.message = 'Sua publicação aparecerá na comunidade e também na aba "Pedidos de Ajuda".';
    }

    return response;
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

    // Verificar se o post pertence ao usuário ou se é admin/creator
    const { data: existingPost } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', data.id)
      .single();

    if (!existingPost) {
      return { error: 'Post não encontrado' };
    }

    // APENAS admin/creator pode editar posts (usuários só podem deletar)
    const adminCheck = await verifyAdminOrCreator(user.id);
    if (adminCheck.error) {
      return { error: 'Apenas administradores e criadores podem editar posts' };
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
      postsLogger.error('Erro ao atualizar post', { error: sanitizeError(error) });
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
      // Validar tipo de arquivo usando magic bytes (conteúdo real)
      // Não confiar em file.type que pode ser manipulado pelo cliente
      const validation = await validateFileMagicBytes(file);
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
          errorMessage = `"${fileName}": Tipo de arquivo não suportado. Use apenas: JPEG, PNG, GIF, WebP ou SVG.`;
        } else if (validation.error?.includes('muito pequeno')) {
          errorMessage = `"${fileName}": Arquivo corrompido ou muito pequeno para ser uma imagem válida.`;
        } else if (validation.error?.includes('não é permitido')) {
          errorMessage = `"${fileName}": ${validation.error}`;
        } else {
          errorMessage = `"${fileName}": ${validation.error || 'Arquivo inválido'}. Formatos aceitos: JPEG, PNG, GIF, WebP e SVG.`;
        }

        return { error: errorMessage };
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const fileName = file.name.length > 30
          ? `${file.name.substring(0, 27)}...`
          : file.name;
        return { error: `"${fileName}": Imagem muito grande. Máximo 5MB por arquivo.` };
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
        postsLogger.error('Erro no upload de imagem', { error: sanitizeError(uploadError) });
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

    // Verificar se usuario e admin ou criador
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado. Apenas administradores podem aprovar posts.' };
    }

    // Buscar dados do post para notificação
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single();

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

    // Audit log
    await logModerationAction('admin.post_approve', user.id, postId);

    // Notificar autor do post
    if (post) {
      try {
        await notifyPostApproved(post.user_id, postId, post.title || 'Seu post');
      } catch (notifyError) {
        postsLogger.error('Erro ao enviar notificação de aprovação', { error: sanitizeError(notifyError) });
      }
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

    // Verificar se usuario e admin ou criador
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado. Apenas administradores podem rejeitar posts.' };
    }

    // Buscar dados do post para notificação
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single();

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

    // Audit log
    await logModerationAction('admin.post_reject', user.id, postId, { reason });

    // Notificar autor do post
    if (post) {
      try {
        await notifyPostRejected(post.user_id, post.title || 'Seu post', reason);
      } catch (notifyError) {
        postsLogger.error('Erro ao enviar notificação de rejeição', { error: sanitizeError(notifyError) });
      }
    }

    revalidatePath('/feed');
    revalidatePath('/admin/moderacao');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar post bloqueado pela moderacao automatica (apenas admin)
 * Usado para liberar falsos positivos da moderacao com IA
 */
export async function approveBlockedPost(postId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se usuario e admin ou criador
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado. Apenas administradores podem aprovar posts bloqueados.' };
    }

    // Atualizar post para aprovado
    const { error } = await supabase
      .from('posts')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        moderation_reviewed_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (error) {
      return { error: 'Erro ao aprovar post' };
    }

    // Atualizar log de moderacao
    await supabase
      .from('moderation_logs')
      .update({
        decision: 'approved',
      })
      .eq('post_id', postId);

    // Audit log
    await logModerationAction('admin.post_approve', user.id, postId, { wasBlocked: true });

    revalidatePath('/feed');
    revalidatePath('/admin/moderacao');
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

      // Notificar autor do post
      try {
        const [{ data: post }, { data: likerProfile }] = await Promise.all([
          supabase.from('posts').select('user_id').eq('id', postId).single(),
          supabase.from('users').select('full_name').eq('id', user.id).single(),
        ]);

        if (post && post.user_id !== user.id) {
          await notifyNewLike(post.user_id, likerProfile?.full_name || 'Alguém', postId);
        }
      } catch (notifyError) {
        postsLogger.error('Erro ao enviar notificação de like', { error: sanitizeError(notifyError) });
      }

      // ❤️ Dar coração por curtir
      const heartsResult = await giveHearts(user.id, 'LIKE_POST', {
        referenceId: postId,
        referenceType: 'post_like',
        description: 'curtiu um post'
      });

      revalidatePath('/feed');
      return { success: true, hearts: heartsResult.hearts };
    }

    revalidatePath('/feed');
    return { success: true, hearts: 0 };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Curtir post com nível de amor específico
 * Níveis maiores custam corações do usuário mas dão mais para o autor
 */
export async function likePostWithLevel(postId: string, levelId: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Buscar configuração do nível
    const { getLoveLevel } = await import('@/lib/love-levels');
    const level = getLoveLevel(levelId);
    if (!level) {
      return { error: 'Nível de amor inválido' };
    }

    // Verificar saldo do usuário (se nível tem custo)
    if (level.cost > 0) {
      const { data: userCoins } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!userCoins || userCoins.balance < level.cost) {
        return { error: 'Corações insuficientes' };
      }

      // Descontar corações do usuário
      await supabase
        .from('user_coins')
        .update({ balance: userCoins.balance - level.cost })
        .eq('user_id', user.id);

      // Registrar transação de gasto
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: -level.cost,
          type: 'spent',
          description: `💝 ${level.name} em post`,
          reference_id: postId,
          reference_type: 'post_love_level',
        });
    }

    // Verificar se já curtiu
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id, love_level')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Atualizar nível do like existente
      await supabase
        .from('post_likes')
        .update({ love_level: levelId })
        .eq('id', existing.id);
    } else {
      // Adicionar like com nível
      await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
          love_level: levelId,
        });

      // Incrementar contador
      await supabase.rpc('increment_likes', { post_id: postId });
    }

    // Buscar autor do post para dar corações
    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== user.id) {
      // Dar corações ao autor baseado no nível
      const heartsResult = await giveHearts(post.user_id, 'LIKE_POST', {
        referenceId: postId,
        referenceType: 'post_love_level',
        description: `recebeu ${level.name}`
      });

      // Dar corações extras ao autor (reward - 1 porque giveHearts já deu 1)
      if (level.reward > 1) {
        await supabase.rpc('add_user_coins', {
          p_user_id: post.user_id,
          p_amount: level.reward - 1,
          p_type: 'bonus',
          p_description: `🎁 Bônus ${level.name}`
        });
      }
    }

    // Dar coração ao usuário que curtiu (1 coração por engajamento)
    const userHeartsResult = await giveHearts(user.id, 'LIKE_POST', {
      referenceId: postId,
      referenceType: 'post_like',
      description: `deu ${level.name}`
    });

    revalidatePath('/feed');
    return { success: true, hearts: userHeartsResult.hearts };
  } catch (error) {
    postsLogger.error('Erro ao dar like com nível', { error });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Curtir comentário
 */
export async function likeComment(commentId: string): Promise<ActionResponse<{ liked: boolean; likesCount: number }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // ANTI-SPAM: Verificar se usuário está banido de curtir
    const banCheck = await checkBanOrError(user.id, 'like');
    if (banCheck) {
      return banCheck;
    }

    // ANTI-SPAM: Rate limit para likes em comentários
    const rateLimitResult = await checkRateLimit(`like-comment:${user.id}`, RATE_LIMITS.like);
    if (!rateLimitResult.success) {
      // Registrar violação e banir progressivamente
      await recordSpamViolation(user.id, 'like_spam', { reason: 'rate_limit', target: 'comment', commentId });
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return { error: `Muitas curtidas. Você foi bloqueado temporariamente. Aguarde ${retryAfter} segundos.` };
    }

    // Verificar se já curtiu
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    let liked: boolean;

    if (existing) {
      // Remover like
      await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existing.id);

      // Decrementar contador
      await supabase.rpc('decrement_comment_likes', { p_comment_id: commentId });
      liked = false;
    } else {
      // Adicionar like
      await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
        });

      // Incrementar contador
      await supabase.rpc('increment_comment_likes', { p_comment_id: commentId });
      liked = true;
    }

    // Buscar contador atualizado
    const { data: comment } = await supabase
      .from('post_comments')
      .select('likes_count')
      .eq('id', commentId)
      .single();

    revalidatePath('/feed');
    return {
      success: true,
      data: {
        liked,
        likesCount: comment?.likes_count || 0,
      },
    };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Votar em post (termômetro de sentimento)
 * @param voteType -5 a +5 para votar, 0 para remover voto
 */
export async function votePost(
  postId: string,
  voteType: number
): Promise<ActionResponse<{ averageScore: number; totalVotes: number; userVote: number | null }>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Validar range do voto (-5 a +5, exceto 0 que remove)
    if (voteType !== 0 && (voteType < -5 || voteType > 5)) {
      return { error: 'Voto deve estar entre -5 e +5' };
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

    // Buscar dados atualizados
    const [postResult, voteResult] = await Promise.all([
      supabase.from('posts').select('vote_score, vote_count, vote_average').eq('id', postId).single(),
      supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', user.id).single(),
    ]);

    revalidatePath('/feed');
    revalidatePath('/');
    return {
      success: true,
      data: {
        averageScore: postResult.data?.vote_average || 0,
        totalVotes: postResult.data?.vote_count || 0,
        userVote: voteResult.data?.vote_type || null,
      },
    };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Comentar em post (ou responder a um comentário)
 * @param postId - ID do post
 * @param content - Conteúdo do comentário
 * @param parentId - ID do comentário pai (opcional, para respostas)
 */
export async function commentPost(postId: string, content: string, parentId?: string): Promise<ActionResponse<PostComment>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // ANTI-SPAM: Verificar se usuário está banido de comentar
    const banCheck = await checkBanOrError(user.id, 'comment');
    if (banCheck) {
      return banCheck;
    }

    // SEGURANCA: Sanitizar conteudo do comentario para prevenir XSS
    const sanitizedContent = sanitizeText(content, 2000);

    if (!sanitizedContent.trim()) {
      return { error: 'Comentário não pode ser vazio' };
    }

    // ANTI-SPAM: Mínimo de 2 caracteres (bloqueia "." spam)
    if (sanitizedContent.trim().length < 2) {
      // Registrar violação e banir progressivamente
      await recordSpamViolation(user.id, 'comment_spam', { reason: 'too_short', content: sanitizedContent });
      return { error: 'Comentário muito curto. Você foi temporariamente bloqueado por spam.' };
    }

    // ANTI-SPAM: Rate limit - máximo 20 comentários por minuto
    const rateLimitResult = await checkRateLimit(`comment:${user.id}`, RATE_LIMITS.comment);
    if (!rateLimitResult.success) {
      // Registrar violação e banir progressivamente
      await recordSpamViolation(user.id, 'comment_spam', { reason: 'rate_limit' });
      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return { error: `Muitos comentários. Você foi bloqueado temporariamente. Aguarde ${retryAfter} segundos.` };
    }

    // ANTI-SPAM: Bloquear comentário idêntico ao último (em 5 minutos)
    const { data: recentComments } = await supabase
      .from('post_comments')
      .select('content')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentComments && recentComments.length > 0) {
      const isDuplicate = recentComments.some(
        comment => comment.content.trim().toLowerCase() === sanitizedContent.trim().toLowerCase()
      );
      if (isDuplicate) {
        // Registrar violação e banir progressivamente
        await recordSpamViolation(user.id, 'comment_duplicate', { reason: 'duplicate', content: sanitizedContent });
        return { error: 'Comentário duplicado. Você foi temporariamente bloqueado por spam.' };
      }
    }

    // MODERAÇÃO: Verificar toxicidade do comentário
    try {
      const moderationResult = await moderateText(sanitizedContent);

      if (moderationResult.decision === 'blocked') {
        postsLogger.warn('Comentário bloqueado por moderação', {
          userId: user.id,
          postId,
          score: moderationResult.overall_score,
          reasons: moderationResult.blocked_reasons,
        });
        return {
          error: `Comentário bloqueado: ${moderationResult.blocked_reasons.join(', ') || 'conteúdo inadequado detectado'}`,
        };
      }
    } catch (moderationError) {
      // Em caso de erro na moderação, permite o comentário mas loga o erro
      postsLogger.error('Erro na moderação de comentário', { error: sanitizeError(moderationError) });
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: sanitizedContent,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      postsLogger.error('Erro ao criar comentário', { error: sanitizeError(error) });
      return { error: 'Erro ao adicionar comentário' };
    }

    // Incrementar contador de comentários
    const { data: post } = await supabase
      .from('posts')
      .select('comments_count, user_id, title, content')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('posts')
        .update({ comments_count: (post.comments_count || 0) + 1 })
        .eq('id', postId);

      // Notificar autor do post (se não for o próprio autor comentando)
      if (post.user_id !== user.id) {
        try {
          const { data: commenterProfile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single();

          await notifyNewComment(
            post.user_id,
            commenterProfile?.full_name || 'Alguém',
            postId,
            sanitizedContent
          );
        } catch (notifyError) {
          postsLogger.error('Erro ao enviar notificação de comentário', { error: sanitizeError(notifyError) });
        }
      }

      // Se for resposta, notificar autor do comentário pai
      if (parentId) {
        try {
          const { data: parentComment } = await supabase
            .from('post_comments')
            .select('user_id')
            .eq('id', parentId)
            .single();

          if (parentComment && parentComment.user_id !== user.id) {
            const { data: commenterProfile } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', user.id)
              .single();

            await notifyNewComment(
              parentComment.user_id,
              commenterProfile?.full_name || 'Alguém',
              postId,
              `Respondeu seu comentário: ${sanitizedContent}`
            );
          }
        } catch (notifyError) {
          postsLogger.error('Erro ao enviar notificação de resposta', { error: sanitizeError(notifyError) });
        }
      }
    }

    // ❤️ Dar coração por comentar (ou responder)
    await giveHearts(user.id, parentId ? 'REPLY_COMMENT' : 'COMMENT', {
      referenceId: comment.id,
      referenceType: 'comment',
      description: parentId ? 'respondeu um comentário' : 'comentou em um post'
    });

    // 🤖 Auto-responder do Moço (67% de chance, apenas comentários raiz)
    if (!parentId && post) {
      const contextoPost = `${post.title || ''} ${post.content?.substring(0, 200) || ''}`.trim();
      autoResponderComentario(postId, comment.id, sanitizedContent, user.id, contextoPost)
        .catch(err => postsLogger.error('Erro no autoresponder', { error: sanitizeError(err) }));
    }

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
 * Buscar post por ID (para edição)
 */
export async function getPostById(postId: string): Promise<ActionResponse<Post>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !post) {
      return { error: 'Post não encontrado' };
    }

    return { success: true, data: post };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar post com detalhes do autor (para página de detalhes)
 */
export async function getPostWithDetails(postId: string) {
  try {
    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_user_id_fkey(id, full_name, avatar_url, is_creator, member_number)
      `)
      .eq('id', postId)
      .eq('status', 'approved')
      .single();

    if (error || !post) {
      return { error: 'Post não encontrado' };
    }

    // Buscar voto do usuário atual (se logado)
    const { data: { user } } = await supabase.auth.getUser();
    let userVote = null;

    if (user) {
      const { data: vote } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      userVote = vote?.vote_type || null;
    }

    return { success: true, data: { post, userVote } };
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

    // Buscar usuário atual para verificar quais comentários ele curtiu
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:users!post_comments_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      postsLogger.error('Erro ao buscar comentários', { error: sanitizeError(error) });
      throw error;
    }

    // Buscar quais comentários o usuário curtiu
    let userLikedCommentIds: Set<string> = new Set();
    if (user && data && data.length > 0) {
      const commentIds = data.map(c => c.id);
      const { data: userLikes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      if (userLikes) {
        userLikedCommentIds = new Set(userLikes.map(l => l.comment_id));
      }
    }

    // Organizar comentários em estrutura hierárquica (pais com respostas)
    type CommentWithLikes = typeof data[0] & { replies: CommentWithLikes[]; is_liked_by_user: boolean };
    const commentsMap = new Map<string, CommentWithLikes>();
    const rootComments: CommentWithLikes[] = [];

    // Primeiro passo: criar mapa de todos os comentários com info de like
    data?.forEach(comment => {
      commentsMap.set(comment.id, {
        ...comment,
        replies: [],
        is_liked_by_user: userLikedCommentIds.has(comment.id),
      });
    });

    // Segundo passo: organizar hierarquia
    data?.forEach(comment => {
      const commentWithReplies = commentsMap.get(comment.id)!;
      if (comment.parent_id) {
        // É uma resposta - adicionar ao pai
        const parent = commentsMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        // É um comentário raiz
        rootComments.push(commentWithReplies);
      }
    });

    return rootComments;
  } catch {
    return [];
  }
}
