/**
 * Queries para Analytics Avançado
 * Consultas SQL para agregação de atividade de usuários, agrupamento de cohorts e cálculos de retenção
 */

import { createClient } from '@/lib/supabase/server';
import {
  getCohortId,
  getCohortLabel,
  getWeekStart,
  getMonthStart,
  calculatePercentage,
} from './utils';
import type { TimePeriod, CohortData } from '@/types/analytics';

/**
 * Interface para atividade de usuário agregada
 */
export interface UserActivity {
  user_id: string;
  period_start: string;
  period_end: string;
  posts_count: number;
  likes_given: number;
  comments_count: number;
  challenges_completed: number;
  events_attended: number;
  total_activity_score: number;
  last_activity_at: string | null;
}

/**
 * Interface para dados de retenção brutos
 */
export interface RawRetentionData {
  user_id: string;
  cohort_id: string;
  cohort_date: string;
  periods_since_join: number;
  was_active: boolean;
  activity_count: number;
}

/**
 * Buscar atividades de usuários agregadas por período
 * @param startDate - Data de início do período
 * @param endDate - Data de fim do período
 * @param period - Tipo de período (weekly ou monthly)
 */
export async function getUserActivitiesByPeriod(
  startDate: Date,
  endDate: Date,
  period: TimePeriod
): Promise<UserActivity[]> {
  const supabase = await createClient();

  // Buscar todos os usuários (excluindo criadores)
  const { data: users } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('is_creator', false);

  if (!users || users.length === 0) return [];

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // Buscar posts criados no período
  const { data: posts } = await supabase
    .from('posts')
    .select('user_id, created_at')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  // Buscar desafios completados no período
  const { data: challenges } = await supabase
    .from('challenge_participants')
    .select('user_id, approved_at')
    .eq('status', 'approved')
    .gte('approved_at', startDateStr)
    .lte('approved_at', endDateStr);

  // Buscar eventos atendidos no período
  const { data: events } = await supabase
    .from('event_registrations')
    .select('user_id, check_in_time')
    .not('check_in_time', 'is', null)
    .gte('check_in_time', startDateStr)
    .lte('check_in_time', endDateStr);

  // Agregar atividades por usuário
  const activityMap = new Map<string, UserActivity>();

  users.forEach((user) => {
    activityMap.set(user.id, {
      user_id: user.id,
      period_start: startDateStr,
      period_end: endDateStr,
      posts_count: 0,
      likes_given: 0,
      comments_count: 0,
      challenges_completed: 0,
      events_attended: 0,
      total_activity_score: 0,
      last_activity_at: null,
    });
  });

  // Adicionar contagem de posts
  posts?.forEach((post) => {
    const activity = activityMap.get(post.user_id);
    if (activity) {
      activity.posts_count++;
      if (!activity.last_activity_at || post.created_at > activity.last_activity_at) {
        activity.last_activity_at = post.created_at;
      }
    }
  });

  // Adicionar contagem de desafios
  challenges?.forEach((challenge) => {
    const activity = activityMap.get(challenge.user_id);
    if (activity) {
      activity.challenges_completed++;
      if (!activity.last_activity_at || challenge.approved_at > activity.last_activity_at) {
        activity.last_activity_at = challenge.approved_at;
      }
    }
  });

  // Adicionar contagem de eventos
  events?.forEach((event) => {
    const activity = activityMap.get(event.user_id);
    if (activity && event.check_in_time) {
      activity.events_attended++;
      if (!activity.last_activity_at || event.check_in_time > activity.last_activity_at) {
        activity.last_activity_at = event.check_in_time;
      }
    }
  });

  // Calcular score total de atividade (peso: post=5, challenge=10, event=8)
  activityMap.forEach((activity) => {
    activity.total_activity_score =
      activity.posts_count * 5 +
      activity.challenges_completed * 10 +
      activity.events_attended * 8;
  });

  return Array.from(activityMap.values());
}

/**
 * Buscar usuários agrupados por cohort
 * @param period - Tipo de período (weekly ou monthly)
 * @param numberOfPeriods - Número de períodos retroativos para incluir
 */
export async function getUsersByCohort(
  period: TimePeriod,
  numberOfPeriods: number = 12
): Promise<Map<string, string[]>> {
  const supabase = await createClient();

  // Buscar todos os usuários não-criadores
  const { data: users, error } = await supabase
    .from('users')
    .select('id, created_at')
    .eq('is_creator', false)
    .order('created_at', { ascending: false });

  if (error || !users) {
    return new Map();
  }

  // Agrupar usuários por cohort
  const cohortMap = new Map<string, string[]>();
  const currentDate = new Date();

  users.forEach((user) => {
    const userCreatedAt = new Date(user.created_at);
    const cohortId = getCohortId(userCreatedAt, period);

    // Calcular se o cohort está dentro do range de períodos
    const cohortStartDate =
      period === 'weekly'
        ? getWeekStart(userCreatedAt)
        : getMonthStart(userCreatedAt);

    const periodsDiff =
      period === 'weekly'
        ? Math.floor(
            (currentDate.getTime() - cohortStartDate.getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        : Math.floor(
            (currentDate.getFullYear() - cohortStartDate.getFullYear()) * 12 +
              currentDate.getMonth() -
              cohortStartDate.getMonth()
          );

    // Incluir apenas cohorts dentro do range
    if (periodsDiff < numberOfPeriods) {
      if (!cohortMap.has(cohortId)) {
        cohortMap.set(cohortId, []);
      }
      cohortMap.get(cohortId)!.push(user.id);
    }
  });

  return cohortMap;
}

/**
 * Calcular dados de retenção para um cohort específico
 * @param cohortUserIds - IDs dos usuários no cohort
 * @param cohortStartDate - Data de início do cohort
 * @param period - Tipo de período (weekly ou monthly)
 * @param maxPeriods - Número máximo de períodos para analisar
 */
export async function calculateCohortRetention(
  cohortUserIds: string[],
  cohortStartDate: Date,
  period: TimePeriod,
  maxPeriods: number = 12
): Promise<{ period: number; activeUsers: number; retentionRate: number }[]> {
  if (cohortUserIds.length === 0) return [];

  const supabase = await createClient();
  const retentionData: { period: number; activeUsers: number; retentionRate: number }[] = [];
  const cohortSize = cohortUserIds.length;

  // Para cada período desde o cohort start
  for (let periodIndex = 0; periodIndex < maxPeriods; periodIndex++) {
    const periodStart = new Date(cohortStartDate);
    const periodEnd = new Date(cohortStartDate);

    if (period === 'weekly') {
      periodStart.setDate(periodStart.getDate() + periodIndex * 7);
      periodEnd.setDate(periodStart.getDate() + 6);
    } else {
      periodStart.setMonth(periodStart.getMonth() + periodIndex);
      periodEnd.setMonth(periodStart.getMonth() + 1);
      periodEnd.setDate(0); // Último dia do mês
    }

    // Não calcular períodos futuros
    if (periodStart > new Date()) break;

    periodEnd.setHours(23, 59, 59, 999);

    const periodStartStr = periodStart.toISOString();
    const periodEndStr = periodEnd.toISOString();

    // Buscar usuários ativos no período (qualquer atividade)
    const activeUserIds = new Set<string>();

    // Verificar posts
    const { data: posts } = await supabase
      .from('posts')
      .select('user_id')
      .in('user_id', cohortUserIds)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr);

    posts?.forEach((post) => activeUserIds.add(post.user_id));

    // Verificar desafios
    const { data: challenges } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .in('user_id', cohortUserIds)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr);

    challenges?.forEach((challenge) => activeUserIds.add(challenge.user_id));

    // Verificar eventos
    const { data: events } = await supabase
      .from('event_registrations')
      .select('user_id')
      .in('user_id', cohortUserIds)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr);

    events?.forEach((event) => activeUserIds.add(event.user_id));

    const activeUsers = activeUserIds.size;
    const retentionRate = calculatePercentage(activeUsers, cohortSize, 2);

    retentionData.push({
      period: periodIndex,
      activeUsers,
      retentionRate,
    });
  }

  return retentionData;
}

/**
 * Buscar análise completa de cohorts com dados de retenção
 * @param period - Tipo de período (weekly ou monthly)
 * @param numberOfCohorts - Número de cohorts para analisar
 * @param periodsToTrack - Número de períodos para rastrear retenção
 */
export async function getCohortAnalysisData(
  period: TimePeriod = 'monthly',
  numberOfCohorts: number = 6,
  periodsToTrack: number = 6
): Promise<CohortData[]> {
  // Buscar usuários agrupados por cohort
  const cohortMap = await getUsersByCohort(period, numberOfCohorts);

  const cohortDataArray: CohortData[] = [];

  // Para cada cohort, calcular retenção
  for (const [cohortId, userIds] of cohortMap.entries()) {
    // Extrair data do cohort ID
    const cohortDate = parseCohortIdToDate(cohortId, period);
    if (!cohortDate) continue;

    const cohortStartDate =
      period === 'weekly' ? getWeekStart(cohortDate) : getMonthStart(cohortDate);

    // Calcular retenção para este cohort
    const retentionData = await calculateCohortRetention(
      userIds,
      cohortStartDate,
      period,
      periodsToTrack
    );

    const cohortData: CohortData = {
      cohort_id: cohortId,
      cohort_date: cohortStartDate.toISOString(),
      cohort_label: getCohortLabel(cohortDate, period),
      size: userIds.length,
      retention_rates: retentionData.map((r) => r.retentionRate),
      active_users: retentionData.map((r) => r.activeUsers),
    };

    cohortDataArray.push(cohortData);
  }

  // Ordenar por data (mais recente primeiro)
  cohortDataArray.sort((a, b) => b.cohort_date.localeCompare(a.cohort_date));

  return cohortDataArray;
}

/**
 * Buscar usuários ativos em um período específico
 * @param startDate - Data de início
 * @param endDate - Data de fim
 */
export async function getActiveUsersInPeriod(
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  const supabase = await createClient();
  const activeUserIds = new Set<string>();

  const startDateStr = startDate.toISOString();
  const endDateStr = endDate.toISOString();

  // Buscar usuários com posts
  const { data: posts } = await supabase
    .from('posts')
    .select('user_id')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  posts?.forEach((post) => activeUserIds.add(post.user_id));

  // Buscar usuários com participação em desafios
  const { data: challenges } = await supabase
    .from('challenge_participants')
    .select('user_id')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  challenges?.forEach((challenge) => activeUserIds.add(challenge.user_id));

  // Buscar usuários com registros em eventos
  const { data: events } = await supabase
    .from('event_registrations')
    .select('user_id')
    .gte('created_at', startDateStr)
    .lte('created_at', endDateStr);

  events?.forEach((event) => activeUserIds.add(event.user_id));

  return Array.from(activeUserIds);
}

/**
 * Calcular taxa de engajamento média da plataforma
 * @param days - Número de dias para calcular (padrão: 30)
 */
export async function calculatePlatformAverageEngagement(
  days: number = 30
): Promise<number> {
  const supabase = await createClient();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Buscar total de usuários
  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('is_creator', false);

  if (!totalUsers || totalUsers === 0) return 0;

  // Buscar usuários ativos
  const activeUsers = await getActiveUsersInPeriod(startDate, endDate);

  return calculatePercentage(activeUsers.length, totalUsers, 2);
}

/**
 * Buscar estatísticas agregadas da plataforma
 */
export async function getPlatformAggregateStats(): Promise<{
  total_users: number;
  active_users_30d: number;
  avg_posts_per_user: number;
  avg_challenges_per_user: number;
  avg_events_per_user: number;
  engagement_rate: number;
}> {
  const supabase = await createClient();

  // Total de usuários
  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact' })
    .eq('is_creator', false);

  // Usuários ativos nos últimos 30 dias
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const activeUsers = await getActiveUsersInPeriod(startDate, endDate);

  // Total de posts
  const { count: totalPosts } = await supabase
    .from('posts')
    .select('id', { count: 'exact' })
    .eq('status', 'approved');

  // Total de desafios completados
  const { count: totalChallenges } = await supabase
    .from('challenge_participants')
    .select('id', { count: 'exact' })
    .eq('status', 'approved');

  // Total de eventos atendidos
  const { count: totalEvents } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact' })
    .not('check_in_time', 'is', null);

  const total = totalUsers || 0;
  const active = activeUsers.length;
  const posts = totalPosts || 0;
  const challenges = totalChallenges || 0;
  const events = totalEvents || 0;

  return {
    total_users: total,
    active_users_30d: active,
    avg_posts_per_user: total > 0 ? Number((posts / total).toFixed(2)) : 0,
    avg_challenges_per_user: total > 0 ? Number((challenges / total).toFixed(2)) : 0,
    avg_events_per_user: total > 0 ? Number((events / total).toFixed(2)) : 0,
    engagement_rate: calculatePercentage(active, total, 2),
  };
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Converte cohort ID para data
 * @param cohortId - ID do cohort (ex: "2024-W01", "2024-M01")
 * @param period - Tipo de período
 */
function parseCohortIdToDate(cohortId: string, period: TimePeriod): Date | null {
  try {
    const parts = cohortId.split('-');
    if (parts.length !== 2) return null;

    const year = parseInt(parts[0], 10);
    if (isNaN(year)) return null;

    if (period === 'weekly') {
      const weekStr = parts[1].replace('W', '');
      const week = parseInt(weekStr, 10);
      if (isNaN(week)) return null;

      // Calcular primeira semana de janeiro
      const janFirst = new Date(year, 0, 1);
      const daysToMonday = (8 - janFirst.getDay()) % 7;
      const firstMonday = new Date(year, 0, 1 + daysToMonday);

      // Adicionar semanas
      const weekDate = new Date(firstMonday);
      weekDate.setDate(firstMonday.getDate() + (week - 1) * 7);

      return weekDate;
    } else {
      const monthStr = parts[1].replace('M', '');
      const month = parseInt(monthStr, 10);
      if (isNaN(month) || month < 1 || month > 12) return null;

      return new Date(year, month - 1, 1);
    }
  } catch {
    return null;
  }
}
