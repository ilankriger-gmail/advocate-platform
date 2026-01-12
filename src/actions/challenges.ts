'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeVídeoChallenge, isValidYouTubeUrl, type AIVerdict } from '@/lib/gemini';
import { ActionResponse } from '@/types/action';
import type { Challenge, ChallengeParticipant, ChallengeWinner, ParticipationWithChallenge } from '@/lib/supabase/types';
import { logger, maskId, sanitizeError } from '@/lib';

// Tipo de retorno com AI verdict para feedback ao usuário
export type ParticipationResult = {
  participation: ChallengeParticipant;
  aiVerdict: AIVerdict | null;
  challenge: {
    title: string;
    goal_type: 'repetitions' | 'time' | null;
    goal_value: number | null;
  };
};

// Logger contextualizado para o módulo de desafios
const challengesLogger = logger.withContext('[Challenges]');

/**
 * Participar de um desafio fisico
 * Retorna o resultado da participação com o veredito da IA
 */
export async function participateInChallenge(data: {
  challengeId: string;
  resultValue: number;
  vídeoProofUrl?: string;
  socialMediaUrl?: string;
}): Promise<ActionResponse<ParticipationResult>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se o desafio existe e esta ativo
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', data.challengeId)
      .eq('is_active', true)
      .eq('status', 'active')
      .single();

    if (challengeError || !challenge) {
      return { error: 'Desafio não encontrado ou encerrado' };
    }

    if (challenge.type !== 'fisico') {
      return { error: 'Este desafio não aceita participações diretas' };
    }

    // Verificar se já participou
    const { data: existingParticipation } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', data.challengeId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipation) {
      return { error: 'Você já participou deste desafio' };
    }

    // Validar que é URL do YouTube (obrigatório para análise de IA)
    if (!data.vídeoProofUrl) {
      return { error: 'Link do vídeo do YouTube é obrigatório' };
    }

    if (!isValidYouTubeUrl(data.vídeoProofUrl)) {
      return { error: 'Apenas links do YouTube são aceitos. O vídeo deve ser público.' };
    }

    // Analisar vídeo com IA (Gemini assiste o vídeo do YouTube)
    const aiVerdict = await analyzeVídeoChallenge(
      data.vídeoProofUrl,
      challenge.goal_type,
      challenge.goal_value,
      challenge.title
    );

    // Criar participacao com dados da análise de IA
    const { data: participation, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: data.challengeId,
        user_id: user.id,
        result_value: data.resultValue,
        video_proof_url: data.vídeoProofUrl || null,
        social_media_url: data.socialMediaUrl || null,
        status: 'pending',
        coins_earned: 0,
        // Campos de análise de IA
        ai_is_valid: aiVerdict?.isValid ?? null,
        ai_confidence: aiVerdict?.confidence ?? null,
        ai_reason: aiVerdict?.reason ?? null,
        ai_observed_value: aiVerdict?.observedValue ?? null,
        ai_analyzed_at: aiVerdict ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      challengesLogger.error('Erro ao criar participação', {
        challengeId: maskId(data.challengeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao registrar participacao' };
    }

    revalidatePath('/desafios');
    revalidatePath('/dashboard');

    // Retornar resultado completo com AI verdict e dados do desafio
    return {
      success: true,
      data: {
        participation,
        aiVerdict: aiVerdict || null,
        challenge: {
          title: challenge.title,
          goal_type: challenge.goal_type,
          goal_value: challenge.goal_value,
        },
      },
    };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Tipo para atualizações de participação em desafio
 */
type ChallengeParticipantUpdate = {
  result_value?: number;
  video_proof_url?: string;
  social_media_url?: string;
};

/**
 * Atualizar participacao em desafio
 */
export async function updateParticipation(data: {
  participationId: string;
  resultValue?: number;
  vídeoProofUrl?: string;
  socialMediaUrl?: string;
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se a participacao pertence ao usuário e esta pendente
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('id', data.participationId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!participation) {
      return { error: 'Participacao nao encontrada ou já foi avaliada' };
    }

    const updateData: ChallengeParticipantUpdate = {};
    if (data.resultValue !== undefined) updateData.result_value = data.resultValue;
    if (data.vídeoProofUrl !== undefined) updateData.video_proof_url = data.vídeoProofUrl;
    if (data.socialMediaUrl !== undefined) updateData.social_media_url = data.socialMediaUrl;

    const { error } = await supabase
      .from('challenge_participants')
      .update(updateData)
      .eq('id', data.participationId);

    if (error) {
      return { error: 'Erro ao atualizar participacao' };
    }

    revalidatePath('/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

// ============ ADMIN ACTIONS ============

/**
 * Aprovar participacao em desafio (admin)
 */
export async function approveParticipation(participationId: string, customCoins?: number): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    // Buscar participacao e desafio
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('*, challenges(coins_reward)')
      .eq('id', participationId)
      .single() as { data: ParticipationWithChallenge | null };

    if (!participation) {
      return { error: 'Participacao nao encontrada' };
    }

    const coinsReward = customCoins !== undefined ? customCoins : (participation.challenges?.coins_reward || 0);

    // Aprovar participacao
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
        const { data: userCoins } = await supabase
          .from('user_coins')
          .select('balance')
          .eq('user_id', participation.user_id)
          .single();

        await supabase
          .from('user_coins')
          .update({
            balance: (userCoins?.balance || 0) + coinsReward,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', participation.user_id);
      }

      // Registrar transacao
      await supabase
        .from('coin_transactions')
        .insert({
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
 * Rejeitar participacao em desafio (admin)
 */
export async function rejectParticipation(
  participationId: string,
  reason?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

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
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    const { error } = await supabase
      .from('challenges')
      .update({ is_active: isActive })
      .eq('id', challengeId);

    if (error) {
      return { error: 'Erro ao atualizar desafio' };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Marcar prêmio como pago (admin)
 */
export async function markWinnerPaid(winnerId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

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
  // Para fisico
  goal_type?: 'repetitions' | 'time' | null;
  goal_value?: number | null;
  record_video_url?: string | null;
  hashtag?: string | null;
  profile_to_tag?: string | null;
  // Controle
  starts_at?: string | null;
  ends_at?: string | null;
}): Promise<ActionResponse<Challenge>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title: data.title,
        description: data.description || null,
        type: data.type,
        icon: data.icon || '🎯',
        is_active: true,
        status: 'active',
        coins_reward: data.coins_reward || 0,
        // Engajamento/Participe
        instagram_embed_url: data.instagram_embed_url || null,
        prize_amount: data.prize_amount || null,
        num_winners: data.num_winners || 1,
        // Fisico
        goal_type: data.goal_type || null,
        goal_value: data.goal_value || null,
        record_video_url: data.record_video_url || null,
        hashtag: data.hashtag || null,
        profile_to_tag: data.profile_to_tag || null,
        // Controle
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      })
      .select()
      .single();

    if (error) {
      challengesLogger.error('Erro ao criar desafio', {
        error: sanitizeError(error)
      });
      return { error: 'Erro ao criar desafio' };
    }

    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
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
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

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
}): Promise<ActionResponse<ChallengeWinner>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

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
 * Deletar desafio (admin)
 * Só permite deletar se não houver participantes ou ganhadores
 */
export async function deleteChallenge(challengeId: string): Promise<ActionResponse> {
  challengesLogger.info('Iniciando exclusão de desafio', {
    challengeId: maskId(challengeId)
  });

  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    challengesLogger.debug('Verificação de usuário', {
      hasUser: !!user
    });

    if (!user) {
      challengesLogger.warn('Usuário não autenticado ao tentar excluir desafio');
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    challengesLogger.debug('Verificação de autorização', {
      userId: maskId(user.id),
      hasProfile: !!profile,
      hasError: !!profileError
    });

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      challengesLogger.warn('Usuário não autorizado ao tentar excluir desafio', {
        userId: maskId(user.id)
      });
      return { error: 'Acesso não autorizado' };
    }

    // Verificar se existem participantes
    const { count: participantsCount, error: partError } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    challengesLogger.debug('Verificação de participantes', {
      challengeId: maskId(challengeId),
      participantsCount,
      hasError: !!partError
    });

    if (participantsCount && participantsCount > 0) {
      challengesLogger.info('Exclusão bloqueada por participantes vinculados', {
        challengeId: maskId(challengeId),
        participantsCount
      });
      return {
        error: `Não é possível excluir. Existem ${participantsCount} participante(s) vinculado(s).`
      };
    }

    // Verificar se existem ganhadores
    const { count: winnersCount, error: winnersError } = await supabase
      .from('challenge_winners')
      .select('*', { count: 'exact', head: true })
      .eq('challenge_id', challengeId);

    challengesLogger.debug('Verificação de ganhadores', {
      challengeId: maskId(challengeId),
      winnersCount,
      hasError: !!winnersError
    });

    if (winnersCount && winnersCount > 0) {
      challengesLogger.info('Exclusão bloqueada por ganhadores vinculados', {
        challengeId: maskId(challengeId),
        winnersCount
      });
      return {
        error: `Não é possível excluir. Existem ${winnersCount} ganhador(es) vinculado(s).`
      };
    }

    // Deletar o desafio
    challengesLogger.debug('Executando exclusão de desafio');
    const { error, count } = await supabase
      .from('challenges')
      .delete()
      .eq('id', challengeId);

    if (error) {
      challengesLogger.error('Erro ao excluir desafio', {
        challengeId: maskId(challengeId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao excluir desafio' };
    }

    challengesLogger.info('Desafio excluído com sucesso', {
      challengeId: maskId(challengeId)
    });
    revalidatePath('/desafios');
    revalidatePath('/admin/desafios');
    return { success: true };
  } catch (err) {
    challengesLogger.error('Erro inesperado ao excluir desafio', {
      challengeId: maskId(challengeId),
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}