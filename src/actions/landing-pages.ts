'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionResponse } from '@/types/action';

// Tipo para dados da landing page
export interface LandingPageData {
  type: 'challenge' | 'reward';
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  // Específicos de challenge
  challengeType?: 'engajamento' | 'fisico' | 'participe' | 'atos_amor';
  coinsReward?: number;
  goalType?: 'repetitions' | 'time' | null;
  goalValue?: number | null;
  icon?: string;
  endsAt?: string | null;
  // Contadores
  participantsCount?: number;
  // Específicos de reward
  coinsRequired?: number;
  rewardType?: 'digital' | 'physical';
  quantityAvailable?: number | null;
  redemptionsCount?: number;
}

/**
 * Buscar dados de um desafio para landing page (público)
 */
export async function getLandingPageChallenge(id: string): Promise<ActionResponse<LandingPageData>> {
  try {
    const supabase = await createClient();

    // Buscar desafio e contar participantes em paralelo
    const [challengeResult, participantsResult] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .eq('status', 'active')
        .single(),
      supabase
        .from('challenge_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', id)
    ]);

    if (challengeResult.error || !challengeResult.data) {
      return { error: 'Desafio não encontrado' };
    }

    const challenge = challengeResult.data;
    const participantsCount = participantsResult.count || 0;

    return {
      data: {
        type: 'challenge',
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        imageUrl: challenge.thumbnail_url,
        challengeType: challenge.type as 'engajamento' | 'fisico' | 'participe' | 'atos_amor',
        coinsReward: challenge.coins_reward,
        goalType: challenge.goal_type,
        goalValue: challenge.goal_value,
        icon: challenge.icon,
        endsAt: challenge.ends_at,
        participantsCount,
      },
    };
  } catch {
    return { error: 'Erro ao carregar desafio' };
  }
}

/**
 * Buscar dados de um prêmio para landing page (público)
 */
export async function getLandingPageReward(id: string): Promise<ActionResponse<LandingPageData>> {
  try {
    const supabase = await createClient();

    // Buscar prêmio e contar resgates em paralelo
    const [rewardResult, redemptionsResult] = await Promise.all([
      supabase
        .from('rewards')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single(),
      supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('reward_id', id)
    ]);

    if (rewardResult.error || !rewardResult.data) {
      return { error: 'Prêmio não encontrado' };
    }

    const reward = rewardResult.data;
    const redemptionsCount = redemptionsResult.count || 0;

    return {
      data: {
        type: 'reward',
        id: reward.id,
        title: reward.name,
        description: reward.description,
        imageUrl: reward.image_url,
        coinsRequired: reward.coins_required,
        rewardType: reward.type as 'digital' | 'physical',
        quantityAvailable: reward.quantity_available,
        redemptionsCount,
      },
    };
  } catch {
    return { error: 'Erro ao carregar prêmio' };
  }
}

/**
 * Buscar dados para landing page (desafio ou prêmio)
 */
export async function getLandingPageData(
  type: 'desafio' | 'premio',
  id: string
): Promise<ActionResponse<LandingPageData>> {
  if (type === 'desafio') {
    return getLandingPageChallenge(id);
  } else if (type === 'premio') {
    return getLandingPageReward(id);
  }

  return { error: 'Tipo inválido' };
}
