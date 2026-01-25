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
  rewardType?: 'digital' | 'physical' | 'money';
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
        .from('challenge_participants')
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
        rewardType: reward.type as 'digital' | 'physical' | 'money',
        quantityAvailable: reward.quantity_available,
        redemptionsCount,
      },
    };
  } catch {
    return { error: 'Erro ao carregar prêmio' };
  }
}

/**
 * Verificar se é um UUID válido
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Buscar dados para landing page (desafio ou prêmio)
 * Aceita tanto UUID quanto slug
 */
export async function getLandingPageData(
  type: 'desafio' | 'premio',
  idOrSlug: string
): Promise<ActionResponse<LandingPageData>> {
  const isId = isUUID(idOrSlug);

  if (type === 'desafio') {
    return isId
      ? getLandingPageChallenge(idOrSlug)
      : getLandingPageChallengeBySlug(idOrSlug);
  } else if (type === 'premio') {
    return isId
      ? getLandingPageReward(idOrSlug)
      : getLandingPageRewardBySlug(idOrSlug);
  }

  return { error: 'Tipo inválido' };
}

/**
 * Buscar dados de um desafio por slug para landing page (público)
 */
export async function getLandingPageChallengeBySlug(slug: string): Promise<ActionResponse<LandingPageData>> {
  try {
    const supabase = await createClient();

    // Buscar desafio por slug
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('status', 'active')
      .single();

    if (error || !challenge) {
      return { error: 'Desafio não encontrado' };
    }

    // Contar participantes
    const { count: participantsCount } = await supabase
      .from('challenge_participants')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', challenge.id);

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
        participantsCount: participantsCount || 0,
      },
    };
  } catch {
    return { error: 'Erro ao carregar desafio' };
  }
}

/**
 * Buscar dados de um prêmio por slug para landing page (público)
 */
export async function getLandingPageRewardBySlug(slug: string): Promise<ActionResponse<LandingPageData>> {
  try {
    const supabase = await createClient();

    // Buscar prêmio por slug
    const { data: reward, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !reward) {
      return { error: 'Prêmio não encontrado' };
    }

    // Contar resgates
    const { count: redemptionsCount } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('reward_id', reward.id);

    return {
      data: {
        type: 'reward',
        id: reward.id,
        title: reward.name,
        description: reward.description,
        imageUrl: reward.image_url,
        coinsRequired: reward.coins_required,
        rewardType: reward.type as 'digital' | 'physical' | 'money',
        quantityAvailable: reward.quantity_available,
        redemptionsCount: redemptionsCount || 0,
      },
    };
  } catch {
    return { error: 'Erro ao carregar prêmio' };
  }
}
