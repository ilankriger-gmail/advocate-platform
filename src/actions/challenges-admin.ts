'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, maskId, sanitizeError } from '@/lib';
import { generateChallengeThumbnail } from '@/lib/ai/generate-thumbnail';

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
      .select('*, challenges:challenge_id(coins_reward)')
      .eq('id', participationId)
      .single();

    if (!participation) {
      return { error: 'Participacao nao encontrada' };
    }

    // Extrair coins_reward do desafio relacionado
    const challengeData = participation.challenges as { coins_reward: number } | null;
    const coinsReward = customCoins !== undefined ? customCoins : (challengeData?.coins_reward || 0);

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
        // Usar maybeSingle para não falhar se não existir
        const { data: userCoins } = await supabase
          .from('user_coins')
          .select('balance')
          .eq('user_id', participation.user_id)
          .maybeSingle();

        // Usar upsert para criar ou atualizar
        await supabase
          .from('user_coins')
          .upsert({
            user_id: participation.user_id,
            balance: (userCoins?.balance || 0) + coinsReward,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
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
  type: 'engajamento' | 'fisico' | 'participe' | 'atos_amor';
  icon?: string;
  coins_reward: number;
  // Para engajamento/participe
  instagram_embed_url?: string | null;
  prize_amount?: number | null;
  num_winners?: number | null;
  // Para físico
  goal_type?: 'repetitions' | 'time' | null;
  goal_value?: number | null;
  record_video_url?: string | null;
  hashtag?: string | null;
  profile_to_tag?: string | null;
  // Para atos de amor
  action_instructions?: string | null;
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

    // Mapear 'participe' para 'engajamento' no banco (constraint aceita 'engajamento', 'fisico' e 'atos_amor')
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
        record_video_url: data.record_video_url || null,
        hashtag: data.hashtag || null,
        profile_to_tag: data.profile_to_tag || null,
        // Atos de Amor
        action_instructions: data.action_instructions || null,
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

    // Gerar thumbnail e emoji com IA (não bloqueia resposta em caso de erro)
    try {
      challengesAdminLogger.info('Gerando thumbnail e emoji com IA...', {
        challengeId: maskId(challenge.id)
      });

      const thumbnailResult = await generateChallengeThumbnail({
        challengeId: challenge.id,
        title: data.title,
        description: data.description,
        type: data.type,
        icon: data.icon || '🎯',
        goal_type: data.goal_type,
        goal_value: data.goal_value,
        coins_reward: data.coins_reward,
        prize_amount: data.prize_amount,
      });

      if (thumbnailResult.success && thumbnailResult.url) {
        // Atualizar o desafio com a URL da thumbnail e emoji gerado
        const updateData: { thumbnail_url: string; icon?: string } = {
          thumbnail_url: thumbnailResult.url,
        };
        if (thumbnailResult.emoji) {
          updateData.icon = thumbnailResult.emoji;
        }

        await supabase
          .from('challenges')
          .update(updateData)
          .eq('id', challenge.id);

        challengesAdminLogger.info('Thumbnail e emoji gerados com sucesso', {
          challengeId: maskId(challenge.id),
          emoji: thumbnailResult.emoji
        });
      } else {
        challengesAdminLogger.warn('Falha ao gerar thumbnail (desafio criado sem thumbnail)', {
          challengeId: maskId(challenge.id),
          error: thumbnailResult.error
        });
      }
    } catch (thumbnailError) {
      // Não falhar a criação do desafio se a thumbnail falhar
      challengesAdminLogger.warn('Erro ao gerar thumbnail (desafio criado sem thumbnail)', {
        challengeId: maskId(challenge.id),
        error: sanitizeError(thumbnailError)
      });
    }

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
 * Atualizar desafio (admin)
 */
export async function updateChallenge(
  challengeId: string,
  data: {
    title: string;
    description?: string | null;
    type: 'engajamento' | 'fisico' | 'participe' | 'atos_amor';
    icon?: string;
    coins_reward: number;
    // Para engajamento/participe
    instagram_embed_url?: string | null;
    prize_amount?: number | null;
    num_winners?: number | null;
    // Para físico
    goal_type?: 'repetitions' | 'time' | null;
    goal_value?: number | null;
    record_video_url?: string | null;
    hashtag?: string | null;
    profile_to_tag?: string | null;
    // Para atos de amor
    action_instructions?: string | null;
    // Controle
    starts_at?: string | null;
    ends_at?: string | null;
  }
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

    // Mapear 'participe' para 'engajamento' no banco
    const dbType = data.type === 'participe' ? 'engajamento' : data.type;

    const { data: challenge, error } = await supabase
      .from('challenges')
      .update({
        title: data.title,
        description: data.description || null,
        type: dbType,
        icon: data.icon || '🎯',
        coins_reward: data.coins_reward || 0,
        // Engajamento/Participe
        instagram_embed_url: data.instagram_embed_url || null,
        prize_amount: data.prize_amount || null,
        num_winners: data.num_winners || 1,
        // Físico
        goal_type: data.goal_type || null,
        goal_value: data.goal_value || null,
        record_video_url: data.record_video_url || null,
        hashtag: data.hashtag || null,
        profile_to_tag: data.profile_to_tag || null,
        // Atos de Amor
        action_instructions: data.action_instructions || null,
        // Controle
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      })
      .eq('id', challengeId)
      .select()
      .single();

    if (error) {
      challengesAdminLogger.error('Erro ao atualizar desafio', { error: sanitizeError(error) });
      return { error: `Erro ao atualizar desafio: ${error.message}` };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    revalidatePath(`/admin/desafios/${challengeId}`);
    return { success: true, data: challenge };
  } catch {
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

/**
 * Buscar desafio para edição (admin)
 */
export async function getChallengeForEdit(challengeId: string): Promise<ActionResponse> {
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

    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error || !challenge) {
      challengesAdminLogger.error('Desafio não encontrado para edição', {
        challengeId: maskId(challengeId),
        error: error ? sanitizeError(error) : 'not found'
      });
      return { error: 'Desafio não encontrado' };
    }

    return { success: true, data: challenge };
  } catch (err) {
    challengesAdminLogger.error('Erro ao buscar desafio para edição', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Regenerar thumbnail de um desafio existente (admin)
 */
export async function regenerateChallengeThumbnail(
  challengeId: string
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

    // Buscar dados do desafio
    const { data: challenge, error: fetchError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) {
      return { error: 'Desafio não encontrado' };
    }

    challengesAdminLogger.info('Regenerando thumbnail e emoji para desafio existente', {
      challengeId: maskId(challengeId),
      title: challenge.title
    });

    // Gerar thumbnail e emoji com IA
    const thumbnailResult = await generateChallengeThumbnail({
      challengeId: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type as 'fisico' | 'engajamento' | 'participe',
      icon: challenge.icon || '🎯',
      goal_type: challenge.goal_type,
      goal_value: challenge.goal_value,
      coins_reward: challenge.coins_reward || 0,
      prize_amount: challenge.prize_amount,
    });

    if (!thumbnailResult.success || !thumbnailResult.url) {
      challengesAdminLogger.error('Falha ao gerar thumbnail', {
        challengeId: maskId(challengeId),
        error: thumbnailResult.error
      });
      return { error: thumbnailResult.error || 'Erro ao gerar thumbnail' };
    }

    // Atualizar o desafio com a nova thumbnail e emoji
    const updateData: { thumbnail_url: string; icon?: string } = {
      thumbnail_url: thumbnailResult.url,
    };
    if (thumbnailResult.emoji) {
      updateData.icon = thumbnailResult.emoji;
    }

    const { error: updateError } = await supabase
      .from('challenges')
      .update(updateData)
      .eq('id', challengeId);

    if (updateError) {
      challengesAdminLogger.error('Erro ao salvar thumbnail', {
        challengeId: maskId(challengeId),
        error: sanitizeError(updateError)
      });
      return { error: 'Erro ao salvar thumbnail' };
    }

    challengesAdminLogger.info('Thumbnail e emoji regenerados com sucesso', {
      challengeId: maskId(challengeId),
      emoji: thumbnailResult.emoji
    });

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    revalidatePath(`/admin/desafios/${challengeId}`);
    revalidatePath(`/admin/desafios/${challengeId}/editar`);

    // Adicionar timestamp para evitar cache do navegador
    const thumbnailUrlWithCache = `${thumbnailResult.url}?t=${Date.now()}`;

    return { success: true, data: { thumbnail_url: thumbnailUrlWithCache, icon: thumbnailResult.emoji } };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao regenerar thumbnail', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

// ============================================================
// CRUD de Prêmios de Desafios
// ============================================================

import type { ChallengePrize, PrizeInput } from '@/lib/supabase/types';

/**
 * Buscar prêmios de um desafio
 */
export async function getChallengePrizes(
  challengeId: string
): Promise<ActionResponse<ChallengePrize[]>> {
  try {
    const supabase = await createClient();

    const { data: prizes, error } = await supabase
      .from('challenge_prizes')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      challengesAdminLogger.error('Erro ao buscar prêmios', {
        challengeId: maskId(challengeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao carregar prêmios' };
    }

    return { data: prizes || [] };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao buscar prêmios', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Adicionar prêmio a um desafio
 */
export async function addChallengePrize(
  challengeId: string,
  prize: PrizeInput
): Promise<ActionResponse<ChallengePrize>> {
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

    // Validar dados
    if (!prize.name || prize.name.trim() === '') {
      return { error: 'Nome do prêmio é obrigatório' };
    }

    if (prize.quantity < 1) {
      return { error: 'Quantidade deve ser pelo menos 1' };
    }

    const { data: newPrize, error } = await supabase
      .from('challenge_prizes')
      .insert({
        challenge_id: challengeId,
        type: prize.type,
        name: prize.name.trim(),
        description: prize.description?.trim() || null,
        value: prize.value || null,
        quantity: prize.quantity,
        image_url: prize.image_url || null,
      })
      .select()
      .single();

    if (error) {
      challengesAdminLogger.error('Erro ao adicionar prêmio', {
        challengeId: maskId(challengeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao adicionar prêmio' };
    }

    challengesAdminLogger.info('Prêmio adicionado com sucesso', {
      challengeId: maskId(challengeId),
      prizeId: maskId(newPrize.id),
      type: prize.type
    });

    revalidatePath(`/admin/desafios/${challengeId}`);
    revalidatePath(`/admin/desafios/${challengeId}/editar`);

    return { data: newPrize };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao adicionar prêmio', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Remover prêmio de um desafio
 */
export async function removeChallengePrize(
  prizeId: string
): Promise<ActionResponse> {
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

    // Buscar prêmio para obter o challenge_id (para revalidar cache)
    const { data: prize } = await supabase
      .from('challenge_prizes')
      .select('challenge_id')
      .eq('id', prizeId)
      .single();

    const { error } = await supabase
      .from('challenge_prizes')
      .delete()
      .eq('id', prizeId);

    if (error) {
      challengesAdminLogger.error('Erro ao remover prêmio', {
        prizeId: maskId(prizeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao remover prêmio' };
    }

    challengesAdminLogger.info('Prêmio removido com sucesso', {
      prizeId: maskId(prizeId)
    });

    if (prize?.challenge_id) {
      revalidatePath(`/admin/desafios/${prize.challenge_id}`);
      revalidatePath(`/admin/desafios/${prize.challenge_id}/editar`);
    }

    return { success: true };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao remover prêmio', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Salvar todos os prêmios de um desafio (substituir existentes)
 */
export async function saveChallengePrizes(
  challengeId: string,
  prizes: PrizeInput[]
): Promise<ActionResponse<ChallengePrize[]>> {
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

    // Deletar prêmios existentes
    await supabase
      .from('challenge_prizes')
      .delete()
      .eq('challenge_id', challengeId);

    // Inserir novos prêmios se houver
    if (prizes.length === 0) {
      revalidatePath(`/admin/desafios/${challengeId}`);
      revalidatePath(`/admin/desafios/${challengeId}/editar`);
      return { data: [] };
    }

    const prizesToInsert = prizes.map(prize => ({
      challenge_id: challengeId,
      type: prize.type,
      name: prize.name.trim(),
      description: prize.description?.trim() || null,
      value: prize.value || null,
      quantity: prize.quantity || 1,
      image_url: prize.image_url || null,
    }));

    const { data: newPrizes, error } = await supabase
      .from('challenge_prizes')
      .insert(prizesToInsert)
      .select();

    if (error) {
      challengesAdminLogger.error('Erro ao salvar prêmios', {
        challengeId: maskId(challengeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao salvar prêmios' };
    }

    challengesAdminLogger.info('Prêmios salvos com sucesso', {
      challengeId: maskId(challengeId),
      count: prizes.length
    });

    revalidatePath(`/admin/desafios/${challengeId}`);
    revalidatePath(`/admin/desafios/${challengeId}/editar`);
    revalidatePath('/desafios');

    return { data: newPrizes || [] };
  } catch (err) {
    challengesAdminLogger.error('Erro inesperado ao salvar prêmios', {
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}
