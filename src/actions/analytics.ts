'use server';

import { createClient } from '@/lib/supabase/server';
import { getCohortAnalysisData } from '@/lib/analytics/queries';
import { calculateAverage, calculatePercentage, calculateConversionRate } from '@/lib/analytics/utils';
import { ActionResponse } from '@/types/action';
import type { CohortAnalysis, TimePeriod, EngagementFunnel, FunnelStage } from '@/types/analytics';

// Tipo para período de overview
type OverviewPeriod = '7d' | '30d' | '90d';

// Interface para métricas de overview
interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPosts: number;
  totalChallenges: number;
  completedChallenges: number;
  retentionRate: number;
  engagementRate: number;
  previousPeriod: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalPosts: number;
  };
}

/**
 * Buscar métricas de overview do dashboard
 * @param period - Período de análise (7d, 30d, 90d)
 */
export async function getOverviewMetrics(
  period: OverviewPeriod = '30d'
): Promise<ActionResponse<OverviewMetrics>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Calcular datas
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - periodDays);

    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - periodDays);

    const startDateStr = startDate.toISOString();
    const previousStartStr = previousStartDate.toISOString();
    const nowStr = now.toISOString();

    // Total de usuários
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Novos usuários no período
    const { count: newUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr)
      .lte('created_at', nowStr);

    // Novos usuários no período anterior
    const { count: previousNewUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartStr)
      .lt('created_at', startDateStr);

    // Usuários ativos (criaram post, participaram de desafio ou evento)
    const { data: activePosts } = await supabase
      .from('posts')
      .select('user_id')
      .gte('created_at', startDateStr);

    const { data: activeChallenges } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .gte('created_at', startDateStr);

    const { data: activeEvents } = await supabase
      .from('event_registrations')
      .select('user_id')
      .gte('created_at', startDateStr);

    const activeUserIds = new Set<string>();
    activePosts?.forEach(p => activeUserIds.add(p.user_id));
    activeChallenges?.forEach(c => activeUserIds.add(c.user_id));
    activeEvents?.forEach(e => activeUserIds.add(e.user_id));
    const activeUsers = activeUserIds.size;

    // Usuários ativos no período anterior
    const { data: prevActivePosts } = await supabase
      .from('posts')
      .select('user_id')
      .gte('created_at', previousStartStr)
      .lt('created_at', startDateStr);

    const { data: prevActiveChallenges } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .gte('created_at', previousStartStr)
      .lt('created_at', startDateStr);

    const prevActiveUserIds = new Set<string>();
    prevActivePosts?.forEach(p => prevActiveUserIds.add(p.user_id));
    prevActiveChallenges?.forEach(c => prevActiveUserIds.add(c.user_id));
    const previousActiveUsers = prevActiveUserIds.size;

    // Posts no período
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Posts no período anterior
    const { count: previousPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartStr)
      .lt('created_at', startDateStr);

    // Desafios
    const { count: totalChallenges } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    const { count: completedChallenges } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('created_at', startDateStr);

    // Taxa de retenção D7 (usuários que registraram há 7+ dias e voltaram)
    const retentionStartDate = new Date(now);
    retentionStartDate.setDate(retentionStartDate.getDate() - 7 - periodDays);
    const retentionEndDate = new Date(now);
    retentionEndDate.setDate(retentionEndDate.getDate() - 7);

    const { data: cohortUsers } = await supabase
      .from('users')
      .select('id')
      .gte('created_at', retentionStartDate.toISOString())
      .lt('created_at', retentionEndDate.toISOString());

    const cohortUserIds = cohortUsers?.map(u => u.id) || [];
    let returnedUsers = 0;

    if (cohortUserIds.length > 0) {
      const { data: returnedPosts } = await supabase
        .from('posts')
        .select('user_id')
        .in('user_id', cohortUserIds)
        .gte('created_at', retentionEndDate.toISOString());

      const { data: returnedChallenges } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .in('user_id', cohortUserIds)
        .gte('created_at', retentionEndDate.toISOString());

      const returnedUserIds = new Set<string>();
      returnedPosts?.forEach(p => returnedUserIds.add(p.user_id));
      returnedChallenges?.forEach(c => returnedUserIds.add(c.user_id));
      returnedUsers = returnedUserIds.size;
    }

    const retentionRate = cohortUserIds.length > 0
      ? (returnedUsers / cohortUserIds.length) * 100
      : 0;

    // Taxa de engajamento (usuários ativos / total de usuários)
    const engagementRate = (totalUsers || 0) > 0
      ? (activeUsers / (totalUsers || 1)) * 100
      : 0;

    return {
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers,
        newUsers: newUsers || 0,
        totalPosts: totalPosts || 0,
        totalChallenges: totalChallenges || 0,
        completedChallenges: completedChallenges || 0,
        retentionRate,
        engagementRate,
        previousPeriod: {
          totalUsers: (totalUsers || 0) - (newUsers || 0),
          activeUsers: previousActiveUsers,
          newUsers: previousNewUsers || 0,
          totalPosts: previousPosts || 0,
        },
      },
    };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return { error: 'Erro ao buscar métricas de overview' };
  }
}

/**
 * Buscar análise de cohort
 * Agrupa usuários por semana/mês de registro e rastreia sua retenção ao longo do tempo
 *
 * @param period - Período de análise (weekly ou monthly)
 * @param numberOfCohorts - Número de cohorts para analisar (padrão: 6)
 * @param periodsToTrack - Número de períodos para rastrear retenção (padrão: 6)
 */
export async function getCohortAnalysis(
  period: TimePeriod = 'monthly',
  numberOfCohorts: number = 6,
  periodsToTrack: number = 6
): Promise<ActionResponse<CohortAnalysis>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Buscar dados de cohort usando a função de query existente
    const cohorts = await getCohortAnalysisData(
      period,
      numberOfCohorts,
      periodsToTrack
    );

    // Calcular médias de retenção
    let avgRetentionPeriod1 = 0;
    let avgRetentionPeriod3 = 0;

    if (cohorts.length > 0) {
      // Média de retenção no período 1 (primeiro período após registro)
      const period1Values = cohorts
        .map(c => c.retention_rates[1])
        .filter((val): val is number => val !== undefined && val !== null);

      if (period1Values.length > 0) {
        avgRetentionPeriod1 = calculateAverage(period1Values);
      }

      // Média de retenção no período 3
      const period3Values = cohorts
        .map(c => c.retention_rates[3])
        .filter((val): val is number => val !== undefined && val !== null);

      if (period3Values.length > 0) {
        avgRetentionPeriod3 = calculateAverage(period3Values);
      }
    }

    // Construir resposta de análise de cohort
    const analysis: CohortAnalysis = {
      period,
      cohorts,
      analyzed_at: new Date().toISOString(),
      total_periods: periodsToTrack,
      avg_retention_period_1: Number(avgRetentionPeriod1.toFixed(2)),
      avg_retention_period_3: Number(avgRetentionPeriod3.toFixed(2)),
    };

    return { success: true, data: analysis };
  } catch {
    return { error: 'Erro ao buscar análise de cohort' };
  }
}

/**
 * Buscar funil de engajamento
 * Calcula métricas de view → participate → complete → return para desafios e eventos
 *
 * @param periodDays - Número de dias para análise (padrão: 30)
 */
export async function getEngagementFunnel(
  periodDays: number = 30
): Promise<ActionResponse<EngagementFunnel>> {
  try {
    const supabase = await createClient();

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Calcular range de datas
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // 1. VIEW: Usuários que registraram para desafios ou eventos (ponto de entrada do funil)
    // Buscar todos os usuários que se registraram em desafios
    const { data: challengeParticipants } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // Buscar todos os usuários que se registraram em eventos
    const { data: eventRegistrations } = await supabase
      .from('event_registrations')
      .select('user_id')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const viewUsers = new Set<string>();
    challengeParticipants?.forEach((p) => viewUsers.add(p.user_id));
    eventRegistrations?.forEach((r) => viewUsers.add(r.user_id));

    // 2. PARTICIPATE: Mesmo que VIEW (usuários que se registraram)
    const participateUsers = new Set<string>(viewUsers);

    // 3. COMPLETE: Usuários que completaram desafios (status approved) ou fizeram check-in em eventos
    const { data: completedChallenges } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('status', 'approved')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const { data: checkedInEvents } = await supabase
      .from('event_registrations')
      .select('user_id')
      .not('check_in_time', 'is', null)
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const completeUsers = new Set<string>();
    completedChallenges?.forEach((c) => completeUsers.add(c.user_id));
    checkedInEvents?.forEach((e) => completeUsers.add(e.user_id));

    // 4. RETURN: Usuários que participaram em mais de um desafio/evento
    // Contar participações por usuário
    const participationCounts = new Map<string, number>();

    challengeParticipants?.forEach((p) => {
      participationCounts.set(p.user_id, (participationCounts.get(p.user_id) || 0) + 1);
    });

    eventRegistrations?.forEach((r) => {
      participationCounts.set(r.user_id, (participationCounts.get(r.user_id) || 0) + 1);
    });

    const returnUsers = new Set<string>();
    participationCounts.forEach((count, userId) => {
      if (count > 1) {
        returnUsers.add(userId);
      }
    });

    // Calcular métricas de cada estágio
    const viewCount = viewUsers.size;
    const participateCount = participateUsers.size;
    const completeCount = completeUsers.size;
    const returnCount = returnUsers.size;

    // Construir estágios do funil
    const stages: FunnelStage[] = [
      {
        stage: 'view',
        label: 'Visualização',
        count: viewCount,
        conversion_rate: 100, // Primeiro estágio sempre 100%
        percentage_of_total: 100,
      },
      {
        stage: 'participate',
        label: 'Participação',
        count: participateCount,
        conversion_rate: calculateConversionRate(participateCount, viewCount),
        percentage_of_total: calculatePercentage(participateCount, viewCount),
      },
      {
        stage: 'complete',
        label: 'Conclusão',
        count: completeCount,
        conversion_rate: calculateConversionRate(completeCount, participateCount),
        percentage_of_total: calculatePercentage(completeCount, viewCount),
      },
      {
        stage: 'return',
        label: 'Retorno',
        count: returnCount,
        conversion_rate: calculateConversionRate(returnCount, completeCount),
        percentage_of_total: calculatePercentage(returnCount, viewCount),
      },
    ];

    // Identificar maior drop-off
    let biggestDropoffStage = 'participate';
    let biggestDropoffRate = 0;

    for (let i = 1; i < stages.length; i++) {
      const previousStage = stages[i - 1];
      const currentStage = stages[i];
      const dropoffRate = 100 - currentStage.conversion_rate;

      if (dropoffRate > biggestDropoffRate) {
        biggestDropoffRate = dropoffRate;
        biggestDropoffStage = currentStage.stage;
      }
    }

    // Taxa de conversão geral (view → return)
    const overallConversionRate = calculateConversionRate(returnCount, viewCount);

    // Construir resposta
    const funnel: EngagementFunnel = {
      stages,
      overall_conversion_rate: overallConversionRate,
      biggest_dropoff_stage: biggestDropoffStage,
      biggest_dropoff_rate: Number(biggestDropoffRate.toFixed(2)),
      analyzed_at: new Date().toISOString(),
      period_days: periodDays,
    };

    return { success: true, data: funnel };
  } catch {
    return { error: 'Erro ao buscar funil de engajamento' };
  }
}

// Interface para breakdown de atividades
interface ActivityBreakdownData {
  posts: number;
  challenges: number;
  events: number;
  rewards: number;
}

/**
 * Buscar breakdown de atividades por categoria
 * @param period - Período de análise (7d, 30d, 90d)
 */
export async function getActivityBreakdown(
  period: OverviewPeriod = '30d'
): Promise<ActionResponse<ActivityBreakdownData>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startDateStr = startDate.toISOString();

    // Contar posts
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Contar participações em desafios
    const { count: challengesCount } = await supabase
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Contar registros em eventos
    const { count: eventsCount } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    // Contar resgates de recompensas
    const { count: rewardsCount } = await supabase
      .from('redemptions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDateStr);

    return {
      success: true,
      data: {
        posts: postsCount || 0,
        challenges: challengesCount || 0,
        events: eventsCount || 0,
        rewards: rewardsCount || 0,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar breakdown:', error);
    return { error: 'Erro ao buscar breakdown de atividades' };
  }
}

// Interface para segmentos de usuários
interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  avgEngagement: number;
}

interface UserSegmentAnalysis {
  byRole: UserSegment[];
  byAdvocateLevel: UserSegment[];
  byTenure: UserSegment[];
  byEngagement: UserSegment[];
}

/**
 * Buscar análise de segmentos de usuários
 * @param period - Período de análise (7d, 30d, 90d)
 */
export async function getUserSegmentAnalysis(
  period: OverviewPeriod = '30d'
): Promise<ActionResponse<UserSegmentAnalysis>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Buscar todos os usuários com suas atividades
    const { data: users } = await supabase
      .from('users')
      .select('id, role, advocate_level, created_at, is_creator');

    if (!users) {
      return { success: true, data: { byRole: [], byAdvocateLevel: [], byTenure: [], byEngagement: [] } };
    }

    const totalUsers = users.length;

    // Por Role
    const roleGroups: Record<string, number> = {};
    users.forEach(u => {
      const role = u.is_creator ? 'creator' : (u.role || 'fan');
      roleGroups[role] = (roleGroups[role] || 0) + 1;
    });

    const byRole: UserSegment[] = Object.entries(roleGroups).map(([name, count]) => ({
      name: name === 'admin' ? 'Admin' : name === 'creator' ? 'Creator' : 'Fan',
      count,
      percentage: (count / totalUsers) * 100,
      avgEngagement: 0,
    }));

    // Por Advocate Level
    const levelGroups: Record<number, number> = {};
    users.forEach(u => {
      const level = u.advocate_level || 1;
      levelGroups[level] = (levelGroups[level] || 0) + 1;
    });

    const byAdvocateLevel: UserSegment[] = Object.entries(levelGroups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, count]) => ({
        name: `Nível ${level}`,
        count,
        percentage: (count / totalUsers) * 100,
        avgEngagement: 0,
      }));

    // Por Tenure (tempo na plataforma)
    const now = new Date();
    const tenureGroups = { new: 0, regular: 0, veteran: 0 };

    users.forEach(u => {
      const createdAt = new Date(u.created_at);
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceCreation <= 30) {
        tenureGroups.new++;
      } else if (daysSinceCreation <= 90) {
        tenureGroups.regular++;
      } else {
        tenureGroups.veteran++;
      }
    });

    const byTenure: UserSegment[] = [
      { name: 'Novos (<30d)', count: tenureGroups.new, percentage: (tenureGroups.new / totalUsers) * 100, avgEngagement: 0 },
      { name: 'Regulares (30-90d)', count: tenureGroups.regular, percentage: (tenureGroups.regular / totalUsers) * 100, avgEngagement: 0 },
      { name: 'Veteranos (>90d)', count: tenureGroups.veteran, percentage: (tenureGroups.veteran / totalUsers) * 100, avgEngagement: 0 },
    ];

    // Por Engajamento (baseado em atividades recentes)
    const { data: recentPosts } = await supabase
      .from('posts')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    const { data: recentChallenges } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .gte('created_at', startDate.toISOString());

    const userActivityCount = new Map<string, number>();
    recentPosts?.forEach(p => {
      userActivityCount.set(p.user_id, (userActivityCount.get(p.user_id) || 0) + 1);
    });
    recentChallenges?.forEach(c => {
      userActivityCount.set(c.user_id, (userActivityCount.get(c.user_id) || 0) + 1);
    });

    const engagementGroups = { high: 0, medium: 0, low: 0, inactive: 0 };

    users.forEach(u => {
      const activities = userActivityCount.get(u.id) || 0;
      if (activities >= 5) {
        engagementGroups.high++;
      } else if (activities >= 2) {
        engagementGroups.medium++;
      } else if (activities >= 1) {
        engagementGroups.low++;
      } else {
        engagementGroups.inactive++;
      }
    });

    const byEngagement: UserSegment[] = [
      { name: 'Alto (5+ ativ.)', count: engagementGroups.high, percentage: (engagementGroups.high / totalUsers) * 100, avgEngagement: 5 },
      { name: 'Médio (2-4 ativ.)', count: engagementGroups.medium, percentage: (engagementGroups.medium / totalUsers) * 100, avgEngagement: 3 },
      { name: 'Baixo (1 ativ.)', count: engagementGroups.low, percentage: (engagementGroups.low / totalUsers) * 100, avgEngagement: 1 },
      { name: 'Inativos', count: engagementGroups.inactive, percentage: (engagementGroups.inactive / totalUsers) * 100, avgEngagement: 0 },
    ];

    return {
      success: true,
      data: { byRole, byAdvocateLevel, byTenure, byEngagement },
    };
  } catch (error) {
    console.error('Erro ao buscar segmentos:', error);
    return { error: 'Erro ao buscar análise de segmentos' };
  }
}

// Interface para dados de tendência
interface TrendDataPoint {
  date: string;
  posts: number;
  challenges: number;
  events: number;
  newUsers: number;
}

/**
 * Buscar dados de tendência temporal
 * @param period - Período de análise (7d, 30d, 90d)
 */
export async function getTrendData(
  period: OverviewPeriod = '30d'
): Promise<ActionResponse<TrendDataPoint[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Buscar posts com data
    const { data: posts } = await supabase
      .from('posts')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Buscar desafios com data
    const { data: challenges } = await supabase
      .from('challenge_participants')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Buscar eventos com data
    const { data: events } = await supabase
      .from('event_registrations')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Buscar novos usuários com data
    const { data: users } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString());

    // Agrupar por dia
    const dailyData = new Map<string, TrendDataPoint>();

    // Inicializar todos os dias do período
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, {
        date: dateStr,
        posts: 0,
        challenges: 0,
        events: 0,
        newUsers: 0,
      });
    }

    // Contar por dia
    posts?.forEach(p => {
      const dateStr = new Date(p.created_at).toISOString().split('T')[0];
      const day = dailyData.get(dateStr);
      if (day) day.posts++;
    });

    challenges?.forEach(c => {
      const dateStr = new Date(c.created_at).toISOString().split('T')[0];
      const day = dailyData.get(dateStr);
      if (day) day.challenges++;
    });

    events?.forEach(e => {
      const dateStr = new Date(e.created_at).toISOString().split('T')[0];
      const day = dailyData.get(dateStr);
      if (day) day.events++;
    });

    users?.forEach(u => {
      const dateStr = new Date(u.created_at).toISOString().split('T')[0];
      const day = dailyData.get(dateStr);
      if (day) day.newUsers++;
    });

    const trendData = Array.from(dailyData.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return { success: true, data: trendData };
  } catch (error) {
    console.error('Erro ao buscar tendências:', error);
    return { error: 'Erro ao buscar dados de tendência' };
  }
}
