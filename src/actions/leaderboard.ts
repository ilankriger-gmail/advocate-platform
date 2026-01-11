'use server';

import {
  getCoinsLeaderboard,
  getChallengesLeaderboard,
  getCombinedLeaderboard,
  getUserRank,
  getRelativeLeaderboard,
} from '@/lib/supabase/leaderboard';
import { createClient } from '@/lib/supabase/server';
import type {
  LeaderboardEntry,
  UserRanking,
  TimePeriod,
  LeaderboardCategory,
} from '@/lib/supabase/types';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de leaderboard
const leaderboardLogger = logger.withContext('[Leaderboard]');

type ActionResponse<T = any> = {
  error?: string;
  success?: boolean;
  data?: T;
};

/**
 * Buscar dados do leaderboard por categoria (Top N)
 * @param category - Categoria: 'coins', 'challenges', 'combined'
 * @param period - Período: 'weekly', 'monthly', 'all_time'
 * @param limit - Número de resultados (padrão: 10)
 * @deprecated Use fetchRelativeLeaderboard para ranking relativo
 */
export async function fetchLeaderboard(
  category: LeaderboardCategory,
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    let data: LeaderboardEntry[] = [];

    switch (category) {
      case 'coins':
        data = await getCoinsLeaderboard(period, limit);
        break;
      case 'challenges':
        data = await getChallengesLeaderboard(period, limit);
        break;
      case 'combined':
        data = await getCombinedLeaderboard(period, limit);
        break;
      default:
        return { error: 'Categoria inválida' };
    }

    return { success: true, data };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar leaderboard', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar ranking' };
  }
}

/**
 * Buscar leaderboard relativo (usuários próximos ao usuário atual)
 * Mostra 5 acima + usuário + 5 abaixo = 11 pessoas
 * @param category - Categoria: 'coins', 'challenges', 'combined'
 * @param range - Quantos usuários acima/abaixo mostrar (padrão: 5)
 */
export async function fetchRelativeLeaderboard(
  category: LeaderboardCategory = 'combined',
  range = 5
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    const supabase = await createClient();

    // Obter usuário autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const data = await getRelativeLeaderboard(user.id, category, range);
    return { success: true, data };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar leaderboard relativo', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar ranking' };
  }
}

/**
 * Buscar ranking do usuário atual
 * @param category - Categoria: 'coins', 'challenges', 'combined'
 * @param period - Período: 'weekly', 'monthly', 'all_time'
 */
export async function fetchUserRank(
  category: LeaderboardCategory = 'combined',
  period: TimePeriod = 'all_time'
): Promise<ActionResponse<UserRanking>> {
  try {
    const supabase = await createClient();

    // Obter usuário autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Buscar ranking do usuário
    const ranking = await getUserRank(user.id, category, period);

    if (!ranking) {
      return {
        error: 'Não foi possível obter seu ranking',
      };
    }

    return { success: true, data: ranking };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar ranking do usuário', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar seu ranking' };
  }
}

/**
 * Buscar leaderboard de moedas
 * @param period - Período: 'weekly', 'monthly', 'all_time'
 * @param limit - Número de resultados (padrão: 10)
 */
export async function fetchCoinsLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    const data = await getCoinsLeaderboard(period, limit);
    return { success: true, data };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar leaderboard de moedas', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar ranking de moedas' };
  }
}

/**
 * Buscar leaderboard de desafios
 * @param period - Período: 'weekly', 'monthly', 'all_time'
 * @param limit - Número de resultados (padrão: 10)
 */
export async function fetchChallengesLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    const data = await getChallengesLeaderboard(period, limit);
    return { success: true, data };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar leaderboard de desafios', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar ranking de desafios' };
  }
}

/**
 * Buscar leaderboard combinado (ranking geral)
 * @param período - Período: 'weekly', 'monthly', 'all_time'
 * @param limit - Número de resultados (padrão: 10)
 */
export async function fetchCombinedLeaderboard(
  period: TimePeriod = 'all_time',
  limit = 10
): Promise<ActionResponse<LeaderboardEntry[]>> {
  try {
    const data = await getCombinedLeaderboard(period, limit);
    return { success: true, data };
  } catch (error) {
    leaderboardLogger.error('Erro ao buscar leaderboard combinado', { error: sanitizeError(error) });
    return { error: 'Erro ao buscar ranking geral' };
  }
}
