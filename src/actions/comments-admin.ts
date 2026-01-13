'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de comentários admin
const commentsAdminLogger = logger.withContext('[CommentsAdmin]');

/**
 * Deletar comentário (soft delete - apenas admin)
 */
export async function deleteCommentAdmin(commentId: string): Promise<ActionResponse<boolean>> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    const supabase = await createClient();

    // Buscar comentário para log
    const { data: comment } = await supabase
      .from('post_comments')
      .select('id, user_id, content, post_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return { error: 'Comentário não encontrado' };
    }

    commentsAdminLogger.info('Admin deletando comentário', {
      commentId,
      commentUserId: comment.user_id,
      postId: comment.post_id,
      adminId: user.id,
    });

    // Soft delete - marcar como deletado
    const { error } = await supabase
      .from('post_comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (error) {
      commentsAdminLogger.error('Erro ao deletar comentário', { error: sanitizeError(error) });
      return { error: 'Erro ao deletar comentário' };
    }

    // Revalidar cache
    revalidatePath('/feed');
    revalidatePath('/admin/comentarios');

    commentsAdminLogger.info('Comentário deletado com sucesso pelo admin', {
      commentId,
      adminId: user.id,
    });

    return { data: true };
  } catch (err) {
    commentsAdminLogger.error('Erro ao deletar comentário', { error: sanitizeError(err) });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Restaurar comentário deletado (apenas admin)
 */
export async function restoreCommentAdmin(commentId: string): Promise<ActionResponse<boolean>> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    const supabase = await createClient();

    // Restaurar comentário
    const { error } = await supabase
      .from('post_comments')
      .update({ is_deleted: false })
      .eq('id', commentId);

    if (error) {
      commentsAdminLogger.error('Erro ao restaurar comentário', { error: sanitizeError(error) });
      return { error: 'Erro ao restaurar comentário' };
    }

    // Revalidar cache
    revalidatePath('/feed');
    revalidatePath('/admin/comentarios');

    commentsAdminLogger.info('Comentário restaurado com sucesso pelo admin', {
      commentId,
      adminId: user.id,
    });

    return { data: true };
  } catch (err) {
    commentsAdminLogger.error('Erro ao restaurar comentário', { error: sanitizeError(err) });
    return { error: 'Erro interno do servidor' };
  }
}
