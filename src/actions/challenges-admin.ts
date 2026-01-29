'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, maskId, sanitizeError } from '@/lib';
import { generateChallengeThumbnail } from '@/lib/ai/generate-thumbnail';
import { notifyChallengeApproved, notifyChallengeRejected, notifyChallengeWinner } from '@/actions/notifications';
import { sendChallengeApprovedEmail } from '@/lib/email';

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

    // Buscar participação, desafio e usuário
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenges:challenge_id(id, coins_reward, title, icon),
        profiles:user_id(id, full_name, avatar_url)
      `)
      .eq('id', participationId)
      .single();

    if (!participation) {
      return { error: 'Participacao nao encontrada' };
    }

    // Extrair dados do desafio e usuário
    const challengeData = participation.challenges as { id: string; coins_reward: number; title: string; icon: string } | null;
    const userData = participation.profiles as { id: string; full_name: string; avatar_url: string } | null;
    const coinsReward = customCoins !== undefined ? customCoins : (challengeData?.coins_reward || 0);
    const challengeTitle = challengeData?.title || 'Desafio';

    // Aprovar participação
    const { error: updateError } = await supabase
      .from('challenge_participants')
      .update({
        status: 'approved',
        coins_earned: coinsReward,
      })
      .eq('id', participationId);

    if (updateError) {
      challengesAdminLogger.error('Erro ao aprovar participação', {
        participationId,
        error: sanitizeError(updateError)
      });
      return { error: `Erro ao aprovar: ${updateError.message || updateError.code}` };
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

    // Notificar usuário da aprovação
    try {
      await notifyChallengeApproved(participation.user_id, challengeTitle, coinsReward);
    } catch (notifyError) {
      challengesAdminLogger.error('Erro ao enviar notificação de aprovação', { error: sanitizeError(notifyError) });
    }

    // Enviar email de aprovação
    try {
      const { data: userEmail } = await supabase
        .from('users')
        .select('email')
        .eq('id', participation.user_id)
        .single();

      if (userEmail?.email) {
        await sendChallengeApprovedEmail({
          to: userEmail.email,
          userName: userData?.full_name || 'Participante',
          challengeTitle,
          coinsReward,
        });
        challengesAdminLogger.info('Email de aprovação enviado', { 
          participationId, 
          email: userEmail.email.replace(/(.{2}).*@/, '$1***@') 
        });
      }
    } catch (emailError) {
      challengesAdminLogger.error('Erro ao enviar email de aprovação', { error: sanitizeError(emailError) });
    }

    // Criar post de celebração no feed
    try {
      const userName = userData?.full_name || 'Um membro';
      const challengeIcon = challengeData?.icon || '🏆';
      const videoUrl = participation.video_proof_url || participation.social_media_url || participation.instagram_proof_url;
      
      // Conteúdo do post de celebração
      const celebrationContent = `🎉 <strong>${userName}</strong> completou o desafio "${challengeTitle}" e ganhou <strong>${coinsReward} corações</strong>! ${challengeIcon}

${participation.result_value ? `📊 Resultado: ${participation.result_value}` : ''}

Parabéns pela conquista! 👏❤️`;

      // Criar post de celebração no perfil do USUÁRIO que completou o desafio
      // Assim aparece no perfil dele
      const participantUserId = participation.user_id;

      if (participantUserId) {
        // Verificar se é YouTube para embedar corretamente
        const isYouTube = videoUrl && /youtube\.com|youtu\.be/.test(videoUrl);
        
        await supabase.from('posts').insert({
          user_id: participantUserId, // Post do próprio usuário!
          title: '🏆 Completei um Desafio!',
          content: celebrationContent,
          type: 'community',
          status: 'approved', // Já aprovado automaticamente
          content_category: 'normal',
          // Para YouTube, usar youtube_url para embed
          youtube_url: isYouTube ? videoUrl : null,
          media_type: isYouTube ? 'youtube' : (videoUrl ? 'video' : 'none'),
          // Para vídeos não-YouTube, usar media_url
          media_url: (!isYouTube && videoUrl) ? [videoUrl] : null,
        });
        
        challengesAdminLogger.info('Post de celebração criado', { 
          participationId, 
          userName,
          coinsReward 
        });
      }
    } catch (postError) {
      // Não falhar a aprovação se o post não for criado
      challengesAdminLogger.error('Erro ao criar post de celebração', { error: sanitizeError(postError) });
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    revalidatePath('/'); // Revalidar feed
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

    // Buscar participação e desafio para notificação
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('user_id, challenges:challenge_id(title)')
      .eq('id', participationId)
      .single();

    const { error } = await supabase
      .from('challenge_participants')
      .update({
        status: 'rejected',
      })
      .eq('id', participationId);

    if (error) {
      challengesAdminLogger.error('Erro ao rejeitar participação', {
        participationId,
        error: sanitizeError(error)
      });
      return { error: `Erro ao rejeitar: ${error.message || error.code}` };
    }

    // Notificar usuário da rejeição
    if (participation) {
      try {
        const challengeData = participation.challenges as unknown as { title: string } | null;
        await notifyChallengeRejected(
          participation.user_id,
          challengeData?.title || 'Desafio',
          reason
        );
      } catch (notifyError) {
        challengesAdminLogger.error('Erro ao enviar notificação de rejeição', { error: sanitizeError(notifyError) });
      }
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Reverter aprovação - remove corações e volta para pendente
 */
export async function revertApproval(
  participationId: string
): Promise<ActionResponse> {
  try {
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) return userCheck;
    
    const authCheck = await verifyAdminOrCreator(userCheck.data!.id);
    if (authCheck.error) return authCheck;

    const supabase = await createClient();

    // Buscar participação para saber quantos corações remover
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('user_id, coins_earned, status')
      .eq('id', participationId)
      .single();

    if (!participation) {
      return { error: 'Participação não encontrada' };
    }

    if (participation.status !== 'approved') {
      return { error: 'Participação não está aprovada' };
    }

    const coinsToRemove = participation.coins_earned || 0;

    // Remover corações do usuário
    if (coinsToRemove > 0) {
      await supabase.rpc('add_user_coins', {
        p_user_id: participation.user_id,
        p_amount: -coinsToRemove, // Negativo para remover
      });

      // Registrar transação de remoção
      await supabase.from('coin_transactions').insert({
        user_id: participation.user_id,
        amount: -coinsToRemove,
        type: 'refund',
        description: 'Aprovação revertida pelo admin',
      });
    }

    // Voltar status para pending
    const { error } = await supabase
      .from('challenge_participants')
      .update({
        status: 'pending',
        coins_earned: 0,
      })
      .eq('id', participationId);

    if (error) {
      return { error: `Erro ao reverter: ${error.message}` };
    }

    challengesAdminLogger.info('Aprovação revertida', { participationId, coinsRemoved: coinsToRemove });
    
    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar todas as participações pendentes de um desafio
 */
export async function approveAllPending(
  challengeId: string
): Promise<ActionResponse & { approved?: number }> {
  try {
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) return userCheck;
    
    const authCheck = await verifyAdminOrCreator(userCheck.data!.id);
    if (authCheck.error) return authCheck;

    const supabase = await createClient();

    // Buscar desafio para saber recompensa
    const { data: challenge } = await supabase
      .from('challenges')
      .select('coins_reward, title')
      .eq('id', challengeId)
      .single();

    if (!challenge) {
      return { error: 'Desafio não encontrado' };
    }

    const coinsReward = challenge.coins_reward || 0;

    // Buscar todas as participações pendentes
    const { data: pendingParticipations } = await supabase
      .from('challenge_participants')
      .select('id, user_id')
      .eq('challenge_id', challengeId)
      .eq('status', 'pending');

    if (!pendingParticipations || pendingParticipations.length === 0) {
      return { error: 'Nenhuma participação pendente' };
    }

    let approved = 0;

    // Aprovar cada uma
    for (const p of pendingParticipations) {
      // Atualizar status
      await supabase
        .from('challenge_participants')
        .update({
          status: 'approved',
          coins_earned: coinsReward,
        })
        .eq('id', p.id);

      // Dar corações
      if (coinsReward > 0) {
        await supabase.rpc('add_user_coins', {
          p_user_id: p.user_id,
          p_amount: coinsReward,
        });

        await supabase.from('coin_transactions').insert({
          user_id: p.user_id,
          amount: coinsReward,
          type: 'earned',
          description: `Desafio: ${challenge.title}`,
        });
      }

      approved++;
    }

    challengesAdminLogger.info('Todas participações aprovadas', { challengeId, approved });
    
    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true, approved };
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

    // Nota: Thumbnail NÃO é gerada automaticamente.
    // O admin pode gerar manualmente na página de edição se desejar.

    // Auto-publicar post no feed + notificar todos os usuários
    try {
      await announceNewChallenge(challenge);
    } catch (announceErr) {
      challengesAdminLogger.error('Erro ao anunciar desafio (não crítico)', {
        error: sanitizeError(announceErr)
      });
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    revalidatePath('/');
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
 * Atualizar URL da thumbnail do desafio (admin)
 */
export async function updateChallengeThumbnail(
  challengeId: string,
  thumbnailUrl: string | null
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
      .from('challenges')
      .update({ thumbnail_url: thumbnailUrl })
      .eq('id', challengeId);

    if (error) {
      challengesAdminLogger.error('Erro ao atualizar thumbnail', { error: sanitizeError(error) });
      return { error: `Erro ao atualizar thumbnail: ${error.message}` };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    revalidatePath(`/admin/desafios/${challengeId}`);
    return { success: true };
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

    // Buscar título do desafio para notificação
    const { data: challenge } = await supabase
      .from('challenges')
      .select('title')
      .eq('id', data.challengeId)
      .single();

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

    // Notificar usuário que ganhou (se tiver userId)
    if (data.userId && challenge) {
      try {
        await notifyChallengeWinner(
          data.userId,
          challenge.title || 'Desafio',
          data.prizeAmount || 0
        );
      } catch (notifyError) {
        challengesAdminLogger.error('Erro ao enviar notificação de ganhador', { error: sanitizeError(notifyError) });
      }
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

    // Buscar dados do ganhador antes de atualizar
    const { data: winnerData } = await supabase
      .from('challenge_winners')
      .select(`
        *,
        challenges:challenge_id(id, title, icon, coins_reward)
      `)
      .eq('id', winnerId)
      .single();

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

    // Criar post de celebração do PIX na comunidade
    try {
      if (winnerData) {
        const challengeInfo = winnerData.challenges as { id: string; title: string; icon: string; coins_reward: number } | null;
        const challengeTitle = challengeInfo?.title || 'Desafio';
        const challengeIcon = challengeInfo?.icon || '🏆';
        const prizeAmount = winnerData.prize_amount || 0;
        const instagramUser = winnerData.instagram_username;

        // Buscar nome do usuário se tiver user_id
        let userName = instagramUser ? `@${instagramUser}` : 'Um membro';
        if (winnerData.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', winnerData.user_id)
            .single();
          if (profile?.full_name) {
            userName = profile.full_name;
          }
        }

        const pixContent = `💵🎉 <strong>${userName}</strong> ganhou <strong>R$ ${prizeAmount.toFixed(2)}</strong> no desafio "${challengeTitle}"! ${challengeIcon}

O PIX já foi enviado! 🚀

Participe dos desafios e você também pode ganhar! 💪❤️`;

        // Post criado pelo admin (Moço) para dar mais visibilidade
        const MOCO_USER_ID = process.env.MOCO_USER_ID;
        const postUserId = winnerData.user_id || MOCO_USER_ID;

        if (postUserId) {
          await supabase.from('posts').insert({
            user_id: postUserId,
            title: `💵 PIX Enviado - ${challengeTitle}!`,
            content: pixContent,
            type: 'community',
            status: 'approved',
            content_category: 'normal',
            media_url: proofImageUrl ? [proofImageUrl] : null,
            media_type: proofImageUrl ? 'image' : 'none',
          });
          challengesAdminLogger.info('Post de PIX enviado criado', { winnerId, userName, prizeAmount });
        }
      }
    } catch (postError) {
      challengesAdminLogger.error('Erro ao criar post de PIX enviado', { error: sanitizeError(postError) });
    }

    revalidatePath('/admin/desafios');
    revalidatePath('/');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Remover/rejeitar ganhador (admin)
 */
export async function removeWinner(winnerId: string): Promise<ActionResponse> {
  try {
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) return userCheck;

    const authCheck = await verifyAdminOrCreator(userCheck.data!.id);
    if (authCheck.error) return authCheck;

    const supabase = await createClient();

    const { error } = await supabase
      .from('challenge_winners')
      .delete()
      .eq('id', winnerId);

    if (error) {
      challengesAdminLogger.error('Erro ao remover ganhador', { winnerId, error: sanitizeError(error) });
      return { error: 'Erro ao remover ganhador' };
    }

    challengesAdminLogger.info('Ganhador removido', { winnerId });
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

// ============ AUTO-ANNOUNCE NEW CHALLENGE ============

/**
 * Cria post no feed + notificação broadcast quando um desafio novo é publicado
 */
async function announceNewChallenge(challenge: {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  icon?: string;
  coins_reward?: number;
  prize_amount?: number | null;
  instagram_embed_url?: string | null;
}) {
  const supabase = createAdminClient();
  const MOCO_USER_ID = process.env.MOCO_USER_ID;

  if (!MOCO_USER_ID) {
    challengesAdminLogger.warn('MOCO_USER_ID não configurado, pulando anúncio automático');
    return;
  }

  const icon = challenge.icon || '🎯';
  const title = challenge.title;
  const hasInstagram = !!challenge.instagram_embed_url;
  const coins = challenge.coins_reward || 0;

  // Montar texto do post
  let postContent = `<p><strong>${icon} Novo Desafio: ${title}</strong></p>`;
  postContent += `<p>Um novo desafio acaba de ser publicado na Arena! 🔥</p>`;

  if (challenge.description) {
    // Pegar só as primeiras 200 chars da descrição
    const shortDesc = challenge.description.length > 200
      ? challenge.description.substring(0, 200) + '...'
      : challenge.description;
    postContent += `<p>${shortDesc}</p>`;
  }

  if (coins > 0) {
    postContent += `<p>💰 Ganhe <strong>${coins} corações</strong> ao participar!</p>`;
  }

  if (hasInstagram) {
    postContent += `<p>👉 Acesse os Desafios na plataforma para participar!</p>`;
  } else {
    postContent += `<p>👉 Vá até a seção <strong>Desafios</strong> para participar!</p>`;
  }

  // 1. Criar post no feed (como Moço)
  const { error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: MOCO_USER_ID,
      content: postContent,
      status: 'approved',
      is_pinned: false,
    });

  if (postError) {
    challengesAdminLogger.error('Erro ao criar post de anúncio', {
      error: sanitizeError(postError)
    });
  } else {
    challengesAdminLogger.info('Post de anúncio criado para desafio', {
      challengeId: maskId(challenge.id)
    });
  }

  // 2. Notificar todos os usuários
  const { data: users } = await supabase
    .from('users')
    .select('id');

  if (users && users.length > 0) {
    const notifications = users.map(u => ({
      user_id: u.id,
      type: 'new_challenge' as const,
      title: `${icon} Novo Desafio: ${title}`,
      message: coins > 0
        ? `Participe e ganhe ${coins} corações! Confira na seção Desafios.`
        : `Um novo desafio te espera! Confira na seção Desafios.`,
      link: '/desafios',
      icon,
      is_read: false,
    }));

    // Inserir em lotes de 500
    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error: notifErr } = await supabase.from('user_notifications').insert(batch);
      if (notifErr) {
        challengesAdminLogger.error('Erro ao enviar notificações broadcast', {
          batch: i,
          error: sanitizeError(notifErr)
        });
      }
    }

    challengesAdminLogger.info('Notificações de novo desafio enviadas', {
      challengeId: maskId(challenge.id),
      totalUsers: users.length
    });
  }
}
