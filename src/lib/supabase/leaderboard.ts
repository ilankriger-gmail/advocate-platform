/**
 * Queries para Leaderboards e Rankings
 */

import { createClient } from './server';
import type {
  LeaderboardEntry,
  UserRanking,
  TimePeriod,
  LeaderboardCategory,
} from './types';

/**
 * Buscar leaderboard de moedas
 * @param period - Período de tempo: 'weekly', 'monthly', 'all_time'
 * @param limit - Número máximo de resultados (padrão: 10)
 */
export async function getCoinsLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Usar função SQL otimizada para todos os períodos
  const { data, error } = await supabase.rpc('get_coins_leaderboard_by_period', {
    p_period: period,
    p_limit: limit,
  });

  if (error || !data) return [];

  return data.map((entry: { user_id: string; full_name: string; avatar_url: string; total_coins: number; tier: string; rank: number }) => ({
    user_id: entry.user_id,
    full_name: entry.full_name,
    avatar_url: entry.avatar_url,
    score: Number(entry.total_coins) || 0,
    tier: entry.tier as 'bronze' | 'silver' | 'gold' | 'diamond',
    rank: Number(entry.rank) || 0,
    last_activity: null,
  }));
}

/**
 * Buscar leaderboard de desafios completados
 * @param period - Período de tempo: 'weekly', 'monthly', 'all_time'
 * @param limit - Número máximo de resultados (padrão: 10)
 */
export async function getChallengesLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Usar função SQL otimizada
  const { data, error } = await supabase.rpc('get_challenges_leaderboard_by_period', {
    p_period: period,
    p_limit: limit,
  });

  if (error || !data) return [];

  return data.map((entry: { user_id: string; full_name: string; avatar_url: string; challenges_completed: number; tier: string; rank: number }) => ({
    user_id: entry.user_id,
    full_name: entry.full_name,
    avatar_url: entry.avatar_url,
    score: Number(entry.challenges_completed) || 0,
    tier: entry.tier as 'bronze' | 'silver' | 'gold' | 'diamond',
    rank: Number(entry.rank) || 0,
    last_activity: null,
  }));
}

/**
 * Buscar leaderboard combinado (pontuação geral)
 * @param period - Período de tempo: 'weekly', 'monthly', 'all_time'
 * @param limit - Número máximo de resultados (padrão: 10)
 */
export async function getCombinedLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Usar função SQL otimizada para todos os períodos
  const { data, error } = await supabase.rpc('get_combined_leaderboard_by_period', {
    p_period: period,
    p_limit: limit,
  });

  if (error || !data) return [];

  return data.map((entry: { user_id: string; full_name: string; avatar_url: string; total_score: number; tier: string; rank: number }) => ({
    user_id: entry.user_id,
    full_name: entry.full_name,
    avatar_url: entry.avatar_url,
    score: Number(entry.total_score) || 0,
    tier: entry.tier as 'bronze' | 'silver' | 'gold' | 'diamond',
    rank: Number(entry.rank) || 0,
    last_activity: null,
  }));
}

/**
 * Buscar ranking do usuário em uma categoria específica
 * @param userId - ID do usuário
 * @param category - Categoria: 'coins', 'challenges', 'combined'
 * @param period - Período de tempo: 'weekly', 'monthly', 'all_time'
 */
export async function getUserRank(
  userId: string,
  category: LeaderboardCategory = 'combined',
  period: TimePeriod = 'all_time'
): Promise<UserRanking | null> {
  const supabase = await createClient();

  // Mapear categoria para nome da função SQL
  const functionMap: Record<LeaderboardCategory, string> = {
    coins: 'get_user_coins_rank',
    challenges: 'get_user_challenges_rank',
    combined: 'get_user_combined_rank',
  };

  const functionName = functionMap[category];

  const { data, error } = await supabase.rpc(functionName, {
    p_user_id: userId,
    p_period: period,
  });

  if (error || !data || data.length === 0) return null;

  const result = data[0];

  return {
    user_id: userId,
    rank: Number(result.rank_position) || 0,
    score: Number(result.total_coins || result.total_score || result.challenges_completed) || 0,
    tier: result.tier || 'bronze',
    total_participants: Number(result.total_users) || 0,
    category,
    period,
  };
}

/**
 * Buscar leaderboard relativo (usuários próximos ao usuário atual)
 * @param userId - ID do usuário logado
 * @param category - Categoria: 'coins', 'challenges', 'combined'
 * @param range - Quantos usuários acima/abaixo mostrar (padrão: 5)
 */
export async function getRelativeLeaderboard(
  userId: string,
  category: LeaderboardCategory = 'combined',
  range = 5
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Mapear categoria para nome da função SQL
  const functionMap: Record<LeaderboardCategory, string> = {
    coins: 'get_relative_coins_leaderboard',
    challenges: 'get_relative_challenges_leaderboard',
    combined: 'get_relative_combined_leaderboard',
  };

  const functionName = functionMap[category];

  const { data, error } = await supabase.rpc(functionName, {
    p_user_id: userId,
    p_range: range,
  });

  if (error || !data) return [];

  return data.map((entry: { user_id: string; full_name: string; avatar_url: string; score: number; tier: string; rank: number }) => ({
    user_id: entry.user_id,
    full_name: entry.full_name,
    avatar_url: entry.avatar_url,
    score: Number(entry.score) || 0,
    tier: entry.tier as 'bronze' | 'silver' | 'gold' | 'diamond',
    rank: Number(entry.rank) || 0,
    last_activity: null,
  }));
}
