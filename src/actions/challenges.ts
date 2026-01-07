'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeVideoChallenge, type AIVerdict } from '@/lib/gemini';
import type { ActionResponse } from './types';

/**
 * Participar de um desafio fisico
 */
export async function participateInChallenge(data: {
  challengeId: string;
  resultValue: number;
  videoProofUrl?: string;
  socialMediaUrl?: string;
}): Promise<ActionResponse> {
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

    const updateData: any = {};
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
