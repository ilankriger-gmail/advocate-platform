/**
 * Queries para Desafios
 */

import { createClient } from './server';
import type {
  Challenge,
  ChallengeWithStats,
  ChallengeParticipant,
  ChallengeParticipantWithUser,
  ChallengeWinner,
  ChallengeType,
  ParticipantWithUsers,
  ParticipantWithUsersAndChallenge,
} from './types';

/**
 * Buscar todos os desafios ativos
 */
export async function getActiveChallenges(): Promise<ChallengeWithStats[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error || !challenges || challenges.length === 0) return [];

  // Extrair IDs de todos os desafios
  const challengeIds = challenges.map(c => c.id);

  // Buscar contagem de participantes para todos os desafios em uma única query
  const { data: participantCounts } = await supabase
    .from('challenge_participants')
    .select('challenge_id')
    .in('challenge_id', challengeIds);

  // Contar participantes por desafio
  const countsMap = new Map<string, number>();
  if (participantCounts) {
    participantCounts.forEach(p => {
      countsMap.set(p.challenge_id, (countsMap.get(p.challenge_id) || 0) + 1);
    });
  }

  // Buscar participações do usuário em todos os desafios em uma única query
  let userParticipationsMap = new Map<string, ChallengeParticipant>();
  if (user) {
    const { data: userParticipations } = await supabase
      .from('challenge_participants')
      .select('*')
      .in('challenge_id', challengeIds)
      .eq('user_id', user.id);

    if (userParticipations) {
      userParticipations.forEach(p => {
        userParticipationsMap.set(p.challenge_id, p);
      });
    }
  }

  // Combinar dados
  const challengesWithStats = challenges.map(challenge => ({
    ...challenge,
    participants_count: countsMap.get(challenge.id) || 0,
    user_participation: userParticipationsMap.get(challenge.id) || null,
  })) as ChallengeWithStats[];

  return challengesWithStats;
}

/**
 * Buscar desafios por tipo
 */
export async function getChallengesByType(type: ChallengeType): Promise<ChallengeWithStats[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: challenges, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', true)
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error || !challenges || challenges.length === 0) return [];

  // Extrair IDs de todos os desafios
  const challengeIds = challenges.map(c => c.id);

  // Buscar contagem de participantes para todos os desafios em uma única query
  const { data: participantCounts } = await supabase
    .from('challenge_participants')
    .select('challenge_id')
    .in('challenge_id', challengeIds);

  // Contar participantes por desafio
  const countsMap = new Map<string, number>();
  if (participantCounts) {
    participantCounts.forEach(p => {
      countsMap.set(p.challenge_id, (countsMap.get(p.challenge_id) || 0) + 1);
    });
  }

  // Buscar participações do usuário em todos os desafios em uma única query
  let userParticipationsMap = new Map<string, ChallengeParticipant>();
  if (user) {
    const { data: userParticipations } = await supabase
      .from('challenge_participants')
      .select('*')
      .in('challenge_id', challengeIds)
      .eq('user_id', user.id);

    if (userParticipations) {
      userParticipations.forEach(p => {
        userParticipationsMap.set(p.challenge_id, p);
      });
    }
  }

  // Combinar dados
  const challengesWithStats = challenges.map(challenge => ({
    ...challenge,
    participants_count: countsMap.get(challenge.id) || 0,
    user_participation: userParticipationsMap.get(challenge.id) || null,
  })) as ChallengeWithStats[];

  return challengesWithStats;
}

/**
 * Buscar desafio por ID
 */
export async function getChallengeById(challengeId: string): Promise<ChallengeWithStats | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Paralelizar todas as queries usando Promise.all
  const [challengeResult, countResult, userParticipationResult] = await Promise.all([
    // Query 1: Buscar o desafio
    supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single(),

    // Query 2: Buscar contagem de participantes
    supabase
      .from('challenge_participants')
      .select('id', { count: 'exact' })
      .eq('challenge_id', challengeId),

    // Query 3: Buscar participação do usuário (se existir)
    user
      ? supabase
          .from('challenge_participants')
          .select('*')
          .eq('challenge_id', challengeId)
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (challengeResult.error || !challengeResult.data) return null;

  return {
    ...challengeResult.data,
    participants_count: countResult.count || 0,
    user_participation: userParticipationResult.data,
  } as ChallengeWithStats;
}

/**
 * Buscar ranking de um desafio físico
 */
export async function getChallengeRanking(
  challengeId: string,
  limit = 10
): Promise<ChallengeParticipantWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*, users(id, full_name, avatar_url)')
    .eq('challenge_id', challengeId)
    .eq('status', 'approved')
    .order('result_value', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((participant: ParticipantWithUsers) => ({
    ...participant,
    user: participant.users || null,
    users: undefined,
  })) as ChallengeParticipantWithUser[];
}

/**
 * Buscar participações do usuário
 */
export async function getUserParticipations(): Promise<ChallengeParticipant[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return [];

  return data || [];
}

/**
 * Buscar ganhadores de um desafio de engajamento
 */
export async function getChallengeWinners(challengeId: string): Promise<ChallengeWinner[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('challenge_winners')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true });

  if (error) return [];

  return data || [];
}

/**
 * Buscar participações pendentes (para admin)
 */
export async function getPendingParticipations(): Promise<ChallengeParticipantWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*, users(id, full_name, avatar_url), challenges(title, type)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((participant: ParticipantWithUsersAndChallenge) => ({
    ...participant,
    user: participant.users || null,
    users: undefined,
  })) as ChallengeParticipantWithUser[];
}

/**
 * Buscar estatísticas de desafios do usuário
 */
export async function getUserChallengeStats() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: participations } = await supabase
    .from('challenge_participants')
    .select('status, coins_earned')
    .eq('user_id', user.id);

  if (!participations) {
    return {
      total_participations: 0,
      approved_participations: 0,
      total_coins_earned: 0,
    };
  }

  const approved = participations.filter((p) => p.status === 'approved');
  const totalCoins = approved.reduce((sum, p) => sum + (p.coins_earned || 0), 0);

  return {
    total_participations: participations.length,
    approved_participations: approved.length,
    total_coins_earned: totalCoins,
  };
}
