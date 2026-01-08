'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeVideoChallenge, type AIVerdict } from '@/lib/gemini';
<<<<<<< HEAD
<<<<<<< HEAD
import type { ActionResponse } from './types';
import type { Challenge, ChallengeParticipant, ChallengeWinner, ParticipationWithChallenge } from '@/lib/supabase/types';
=======
import { ActionResponse } from '@/types';
>>>>>>> auto-claude/029-consolidate-duplicated-actionresponse-type-into-sh
=======
import { ActionResponse } from '@/types/action';
import type { Challenge, ChallengeParticipant, ChallengeWinner, ParticipationWithChallenge } from '@/lib/supabase/types';
>>>>>>> auto-claude/030-replace-excessive-any-types-with-proper-typescript

/**
 * Participar de um desafio fisico
 */
export async function participateInChallenge(data: {
  challengeId: string;
  resultValue: number;
  videoProofUrl?: string;
  socialMediaUrl?: string;
}): Promise<ActionResponse<ChallengeParticipant>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
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
      return { error: 'Desafio nao encontrado ou encerrado' };
    }

    if (challenge.type !== 'fisico') {
      return { error: 'Este desafio nao aceita participacoes diretas' };
    }

    // Verificar se ja participou
    const { data: existingParticipation } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', data.challengeId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipation) {
      return { error: 'Voce ja participou deste desafio' };
    }

    // Analisar video com IA (se tiver URL)
    let aiVerdict: AIVerdict | null = null;
    if (data.videoProofUrl) {
      aiVerdict = await analyzeVideoChallenge(
        data.videoProofUrl,
        challenge.goal_type,
        challenge.goal_value,
        challenge.title
      );
    }

    // Criar participacao
    const { data: participation, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: data.challengeId,
        user_id: user.id,
        result_value: data.resultValue,
        video_proof_url: data.videoProofUrl || null,
        social_media_url: data.socialMediaUrl || null,
        status: 'pending',
        coins_earned: 0,
        ai_verdict: aiVerdict,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating participation:', error);
      return { error: 'Erro ao registrar participacao' };
    }

    revalidatePath('/desafios');
    revalidatePath('/dashboard');
    return { success: true, data: participation };
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
  videoProofUrl?: string;
  socialMediaUrl?: string;
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se a participacao pertence ao usuario e esta pendente
    const { data: participation } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('id', data.participationId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!participation) {
      return { error: 'Participacao nao encontrada ou ja foi avaliada' };
    }

    const updateData: ChallengeParticipantUpdate = {};
    if (data.resultValue !== undefined) updateData.result_value = data.resultValue;
    if (data.videoProofUrl !== undefined) updateData.video_proof_url = data.videoProofUrl;
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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

    // Adicionar moedas ao usuario
    if (coinsReward > 0) {
      // Atualizar saldo
      const { error: coinsError } = await supabase.rpc('add_user_coins', {
        p_user_id: participation.user_id,
        p_amount: coinsReward,
      });

      // Fallback se a funcao RPC nao existir
      if (coinsError) {
        await supabase
          .from('user_coins')
          .update({
            balance: supabase.rpc('increment', { amount: coinsReward }),
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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
 * Marcar premio como pago (admin)
 */
export async function markWinnerPaid(winnerId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    const { error } = await supabase
      .from('challenge_winners')
      .update({ pix_sent: true })
      .eq('id', winnerId);

    if (error) {
      return { error: 'Erro ao marcar premio como pago' };
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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
      console.error('Error creating challenge:', error);
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
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