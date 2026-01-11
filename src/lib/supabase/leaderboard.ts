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

  // Para all_time, usar a view otimizada
  if (period === 'all_time') {
    const { data, error } = await supabase
      .from('leaderboard_coins')
      .select('user_id, full_name, avatar_url, total_coins, tier, last_activity')
      .order('total_coins', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      full_name: entry.full_name,
      avatar_url: entry.avatar_url,
      score: entry.total_coins || 0,
      tier: entry.tier,
      rank: index + 1,
      last_activity: entry.last_activity,
    }));
  }

  // Para weekly e monthly, filtrar transações por data
  const intervalDays = period === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - intervalDays);

  const { data: transactions, error: txError } = await supabase
    .from('coin_transactions')
    .select('user_id, amount, type')
    .gte('created_at', startDate.toISOString())
    .eq('type', 'earned');

  if (txError || !transactions) return [];

  // Agregar moedas por usuário
  const coinsMap = new Map<string, number>();
  transactions.forEach((tx) => {
    const current = coinsMap.get(tx.user_id) || 0;
    coinsMap.set(tx.user_id, current + tx.amount);
  });

  // Buscar informações dos usuários
  const userIds = Array.from(coinsMap.keys());
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (usersError || !users) return [];

  // Combinar dados e ordenar
  const entries: LeaderboardEntry[] = users
    .map((user) => {
      const score = coinsMap.get(user.id) || 0;
      // Calcular tier baseado no score
      let tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
      if (score >= 1000) tier = 'diamond';
      else if (score >= 500) tier = 'gold';
      else if (score >= 100) tier = 'silver';

      return {
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        score,
        tier,
        rank: 0,
        last_activity: null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return entries;
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

  // Construir filtro de data
  let query = supabase
    .from('challenge_participants')
    .select('user_id, coins_earned, approved_at')
    .eq('status', 'approved');

  if (period !== 'all_time') {
    const intervalDays = period === 'weekly' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - intervalDays);
    query = query.gte('approved_at', startDate.toISOString());
  }

  const { data: participants, error: participantsError } = await query;

  if (participantsError || !participants) return [];

  // Agregar por usuário
  const statsMap = new Map<string, { count: number; coins: number; lastActivity: string | null }>();
  participants.forEach((p) => {
    const current = statsMap.get(p.user_id) || { count: 0, coins: 0, lastActivity: null };
    statsMap.set(p.user_id, {
      count: current.count + 1,
      coins: current.coins + (p.coins_earned || 0),
      lastActivity: p.approved_at > (current.lastActivity || '') ? p.approved_at : current.lastActivity,
    });
  });

  // Buscar informações dos usuários
  const userIds = Array.from(statsMap.keys());
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (usersError || !users) return [];

  // Combinar e ordenar
  const entries: LeaderboardEntry[] = users
    .map((user) => {
      const stats = statsMap.get(user.id)!;
      const score = stats.coins;

      // Calcular tier baseado no score
      let tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
      if (score >= 1000) tier = 'diamond';
      else if (score >= 500) tier = 'gold';
      else if (score >= 100) tier = 'silver';

      return {
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        score: stats.count, // Usar contagem de desafios como score
        tier,
        rank: 0,
        last_activity: stats.lastActivity,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return entries;
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

  // Para all_time, usar a view otimizada
  if (period === 'all_time') {
    const { data, error } = await supabase
      .from('leaderboard_combined')
      .select('user_id, full_name, avatar_url, total_score, tier, last_activity')
      .order('total_score', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      full_name: entry.full_name,
      avatar_url: entry.avatar_url,
      score: entry.total_score || 0,
      tier: entry.tier,
      rank: index + 1,
      last_activity: entry.last_activity,
    }));
  }

  // Para períodos específicos, combinar as três fontes
  const intervalDays = period === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - intervalDays);
  const startDateStr = startDate.toISOString();

  // Buscar moedas ganhas
  const { data: coinTx } = await supabase
    .from('coin_transactions')
    .select('user_id, amount')
    .gte('created_at', startDateStr)
    .eq('type', 'earned');

  // Buscar desafios completados
  const { data: challenges } = await supabase
    .from('challenge_participants')
    .select('user_id')
    .eq('status', 'approved')
    .gte('approved_at', startDateStr);

  // Buscar eventos atendidos
  const { data: events } = await supabase
    .from('event_registrations')
    .select('user_id')
    .not('check_in_time', 'is', null)
    .neq('status', 'cancelled')
    .gte('check_in_time', startDateStr);

  // Combinar dados
  const scoreMap = new Map<string, number>();

  // Adicionar moedas
  coinTx?.forEach((tx) => {
    const current = scoreMap.get(tx.user_id) || 0;
    scoreMap.set(tx.user_id, current + tx.amount);
  });

  // Adicionar pontos de desafios (50 pontos cada)
  challenges?.forEach((c) => {
    const current = scoreMap.get(c.user_id) || 0;
    scoreMap.set(c.user_id, current + 50);
  });

  // Adicionar pontos de eventos (30 pontos cada)
  events?.forEach((e) => {
    const current = scoreMap.get(e.user_id) || 0;
    scoreMap.set(e.user_id, current + 30);
  });

  // Buscar informações dos usuários
  const userIds = Array.from(scoreMap.keys());
  if (userIds.length === 0) return [];

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (usersError || !users) return [];

  // Combinar e ordenar
  const entries: LeaderboardEntry[] = users
    .map((user) => {
      const score = scoreMap.get(user.id) || 0;

      // Calcular tier baseado no score total
      let tier: 'bronze' | 'silver' | 'gold' | 'diamond' = 'bronze';
      if (score >= 1000) tier = 'diamond';
      else if (score >= 500) tier = 'gold';
      else if (score >= 100) tier = 'silver';

      return {
        user_id: user.id,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        score,
        tier,
        rank: 0,
        last_activity: null,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return entries;
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
