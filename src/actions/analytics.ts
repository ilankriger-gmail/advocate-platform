'use server';

import { createClient } from '@/lib/supabase/server';
import { getCohortAnalysisData } from '@/lib/analytics/queries';
import { calculateAverage, calculatePercentage, calculateConversionRate } from '@/lib/analytics/utils';
import { ActionResponse } from '@/types/action';
import type { CohortAnalysis, TimePeriod, EngagementFunnel, FunnelStage } from '@/types/analytics';

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
