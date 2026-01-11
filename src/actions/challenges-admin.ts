'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, maskId, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de desafios admin
const challengesAdminLogger = logger.withContext('[ChallengesAdmin]');

/**
 * Aprovar participação em desafio (admin)
 */
export async function approveParticipation(
  participationId: string,
  customCoins?: number
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    // Buscar participação e desafio
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('*, challenges(coins_reward)')
      .eq('id', participationId)
      .single();

    if (!participation) {
      return { error: 'Participacao nao encontrada' };
    }

    const coinsReward =
      customCoins !== undefined
        ? customCoins
        : ((participation as any).challenges?.coins_reward || 0);

    // Aprovar participação
    const { error: updateError } = await supabase
      .from('challenge_participants')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        coins_earned: coinsReward,
      })
      .eq('id', participationId);

    if (updateError) {
      return { error: 'Erro ao aprovar participacao' };
    }

    // Adicionar moedas ao usuário
    if (coinsReward > 0) {
      // Atualizar saldo
      const { error: coinsError } = await supabase.rpc('add_user_coins', {
        p_user_id: participation.user_id,
        p_amount: coinsReward,
      });

      // Fallback se a função RPC não existir
      if (coinsError) {
        await supabase
          .from('user_coins')
          .update({
            balance: supabase.rpc('increment', { amount: coinsReward }),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', participation.user_id);
      }

      // Registrar transação
      await supabase.from('coin_transactions').insert({
        user_id: participation.user_id,
        amount: coinsReward,
        type: 'earned',
        description: `Desafio concluido`,
        reference_id: participationId,
      });
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Rejeitar participação em desafio (admin)
 */
export async function rejectParticipation(
  participationId: string,
  reason?: string
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        status: 'rejected',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', participationId);

    if (error) {
      return { error: 'Erro ao rejeitar participacao' };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Ativar/Desativar desafio (admin)
 */
export async function toggleChallengeActive(
  challengeId: string,
  isActive: boolean
): Promise<ActionResponse> {
  challengesAdminLogger.info('Iniciando toggle de desafio', {
    challengeId: maskId(challengeId),
    isActive
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    challengesAdminLogger.debug('Verificação de usuário', {
      hasUser: !!userCheck.data,
      hasError: !!userCheck.error
    });

    if (userCheck.error) {
      challengesAdminLogger.warn('Usuário não autenticado ao tentar toggle de desafio');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    challengesAdminLogger.debug('Verificação de autorização', {
      userId: maskId(user.id),
      isAuthorized: !authCheck.error
    });

    if (authCheck.error) {
      challengesAdminLogger.warn('Usuário não autorizado ao tentar toggle de desafio', {
        userId: maskId(user.id)
      });
      return authCheck;
    }

    const supabase = await createClient();

    challengesAdminLogger.debug('Executando update de desafio');
    const { error, data } = await supabase
      .from('challenges')
      .update({ is_active: isActive })
      .eq('id', challengeId)
      .select();

    if (error) {
      challengesAdminLogger.error('Erro ao atualizar desafio', {
        challengeId: maskId(challengeId),
        error: sanitizeError(error)
      });
      return { error: `Erro ao atualizar desafio: ${error.message || error.code}` };
    }

    challengesAdminLogger.info('Desafio atualizado com sucesso', {
      challengeId: maskId(challengeId),
      isActive
    });
    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao toggle de desafio', {
      challengeId: maskId(challengeId),
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Marcar prêmio como pago (admin)
 */
export async function markWinnerPaid(winnerId: string): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_winners')
      .update({ pix_sent: true })
      .eq('id', winnerId);

    if (error) {
      return { error: 'Erro ao marcar prêmio como pago' };
    }

    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Criar desafio (admin)
 */
export async function createChallenge(data: {
  title: string;
  description?: string | null;
  type: 'engajamento' | 'fisico' | 'participe';
  icon?: string;
  coins_reward: number;
  // Para engajamento/participe
  instagram_embed_url?: string | null;
  prize_amount?: number | null;
  num_winners?: number | null;
  // Para físico
  goal_type?: 'repetitions' | 'time' | null;
  goal_value?: number | null;
  record_vídeo_url?: string | null;
  hashtag?: string | null;
  profile_to_tag?: string | null;
  // Controle
  starts_at?: string | null;
  ends_at?: string | null;
}): Promise<ActionResponse> {
  challengesAdminLogger.info('Iniciando criação de desafio', {
    title: data.title,
    type: data.type,
    coinsReward: data.coins_reward
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    // Mapear 'participe' para 'engajamento' no banco (constraint só aceita 'engajamento' e 'fisico')
    const dbType = data.type === 'participe' ? 'engajamento' : data.type;

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title: data.title,
        description: data.description || null,
        type: dbType,
        icon: data.icon || '🎯',
        is_active: true,
        status: 'active',
        coins_reward: data.coins_reward || 0,
        // Engajamento/Participe
        instagram_embed_url: data.instagram_embed_url || null,
        prize_amount: data.prize_amount || null,
        num_winners: data.num_winners || 1,
        // Físico
        goal_type: data.goal_type || null,
        goal_value: data.goal_value || null,
        record_video_url: data.record_vídeo_url || null,
        hashtag: data.hashtag || null,
        profile_to_tag: data.profile_to_tag || null,
        // Controle
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      })
      .select()
      .single();

    if (error) {
      challengesAdminLogger.error('Erro ao criar desafio', {
        error: sanitizeError(error)
      });
      return { error: `Erro ao criar desafio: ${error.message}` };
    }

    challengesAdminLogger.info('Desafio criado com sucesso', {
      challengeId: maskId(challenge.id),
      title: challenge.title
    });
    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true, data: challenge };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao criar desafio', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Encerrar desafio (admin)
 */
export async function closeChallenge(challengeId: string): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('challenges')
      .update({ status: 'closed' })
      .eq('id', challengeId);

    if (error) {
      return { error: 'Erro ao encerrar desafio' };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Registrar ganhador de sorteio (admin)
 */
export async function registerWinner(data: {
  challengeId: string;
  userId?: string;
  instagramUsername?: string;
  prizeAmount?: number;
}): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { data: winner, error } = await supabase
      .from('challenge_winners')
      .insert({
        challenge_id: data.challengeId,
        user_id: data.userId || null,
        instagram_username: data.instagramUsername || null,
        prize_amount: data.prizeAmount || null,
        pix_sent: false,
      })
      .select()
      .single();

    if (error) {
      return { error: 'Erro ao registrar ganhador' };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true, data: winner };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Marcar prêmio como enviado (admin)
 */
export async function markPrizeSent(
  winnerId: string,
  proofImageUrl?: string
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_winners')
      .update({
        pix_sent: true,
        proof_image_url: proofImageUrl || null,
      })
      .eq('id', winnerId);

    if (error) {
      return { error: 'Erro ao marcar prêmio como enviado' };
    }

    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
