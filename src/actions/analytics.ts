'use server';

import { createClient } from '@/lib/supabase/server';
import { getCohortAnalysisData } from '@/lib/analytics/queries';
import { calculateAverage } from '@/lib/analytics/utils';
import { ActionResponse } from '@/types/action';
import type { CohortAnalysis, TimePeriod } from '@/types/analytics';

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
