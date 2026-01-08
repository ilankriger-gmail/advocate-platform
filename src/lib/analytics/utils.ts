/**
 * Utilitários para Analytics Avançado
 * Funções para date ranges, cálculos de percentual, análise de tendência e normalização de dados
 */

import { TimePeriod, TrendDirection } from '@/types/analytics';

/**
 * Interface para range de datas
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Interface para resultado de cohort
 */
export interface CohortPeriod {
  cohort_id: string;
  cohort_label: string;
  start_date: Date;
  end_date: Date;
}

// ==========================================
// FUNÇÕES DE DATE RANGES
// ==========================================

/**
 * Retorna o início da semana para uma data (Segunda-feira)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

/**
 * Retorna o fim da semana para uma data (Domingo)
 */
export function getWeekEnd(date: Date): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

/**
 * Retorna o início do mês para uma data
 */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

/**
 * Retorna o fim do mês para uma data
 */
export function getMonthEnd(date: Date): Date {
  const d = new Date(date);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  return monthEnd;
}

/**
 * Gera identificador de cohort no formato "YYYY-WNN" (semanal) ou "YYYY-MNN" (mensal)
 */
export function getCohortId(date: Date, period: TimePeriod): string {
  const d = new Date(date);
  const year = d.getFullYear();

  if (period === 'weekly') {
    const weekNumber = getWeekNumber(d);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  } else {
    const month = d.getMonth() + 1;
    return `${year}-M${String(month).padStart(2, '0')}`;
  }
}

/**
 * Retorna o número da semana no ano (1-52/53)
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Gera label legível para cohort
 */
export function getCohortLabel(date: Date, period: TimePeriod): string {
  const d = new Date(date);
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  if (period === 'weekly') {
    const weekNumber = getWeekNumber(d);
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `Semana ${weekNumber} - ${monthName} ${year}`;
  } else {
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${monthName} ${year}`;
  }
}

/**
 * Gera dados de período de cohort com todas as informações
 */
export function getCohortPeriod(date: Date, period: TimePeriod): CohortPeriod {
  const start = period === 'weekly' ? getWeekStart(date) : getMonthStart(date);
  const end = period === 'weekly' ? getWeekEnd(date) : getMonthEnd(date);

  return {
    cohort_id: getCohortId(date, period),
    cohort_label: getCohortLabel(date, period),
    start_date: start,
    end_date: end,
  };
}

/**
 * Gera lista de períodos de cohort retroativos
 */
export function generateCohortPeriods(
  endDate: Date,
  periodsCount: number,
  period: TimePeriod
): CohortPeriod[] {
  const periods: CohortPeriod[] = [];
  let currentDate = new Date(endDate);

  for (let i = 0; i < periodsCount; i++) {
    periods.unshift(getCohortPeriod(currentDate, period));

    // Move para o período anterior
    if (period === 'weekly') {
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() - 1);
    }
  }

  return periods;
}

/**
 * Retorna range de datas para os últimos N dias
 */
export function getLastNDaysRange(days: number): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/**
 * Calcula diferença em dias entre duas datas
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ==========================================
// FUNÇÕES DE CÁLCULO DE PERCENTUAL
// ==========================================

/**
 * Calcula percentual com precisão customizável
 */
export function calculatePercentage(
  value: number,
  total: number,
  decimals: number = 2
): number {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return Number(percentage.toFixed(decimals));
}

/**
 * Calcula taxa de conversão entre dois valores
 */
export function calculateConversionRate(
  converted: number,
  total: number,
  decimals: number = 2
): number {
  return calculatePercentage(converted, total, decimals);
}

/**
 * Calcula mudança percentual entre dois valores
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number,
  decimals: number = 2
): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }

  const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  return Number(change.toFixed(decimals));
}

/**
 * Calcula diferença percentual entre valor e média
 */
export function calculateDifferenceFromAverage(
  value: number,
  average: number,
  decimals: number = 2
): number {
  return calculatePercentageChange(average, value, decimals);
}

/**
 * Formata percentual para exibição
 */
export function formatPercentage(
  value: number,
  includeSign: boolean = false,
  decimals: number = 2
): string {
  const formatted = value.toFixed(decimals);

  if (includeSign && value > 0) {
    return `+${formatted}%`;
  }

  return `${formatted}%`;
}

// ==========================================
// FUNÇÕES DE ANÁLISE DE TENDÊNCIA
// ==========================================

/**
 * Determina direção de tendência baseado em mudança percentual
 */
export function getTrendDirection(
  oldValue: number,
  newValue: number,
  threshold: number = 5
): TrendDirection {
  const change = calculatePercentageChange(oldValue, newValue);

  if (Math.abs(change) < threshold) {
    return 'stable';
  }

  return change > 0 ? 'up' : 'down';
}

/**
 * Analisa tendência de uma série temporal
 */
export function analyzeTrend(values: number[]): {
  direction: TrendDirection;
  change: number;
  isSignificant: boolean;
} {
  if (values.length < 2) {
    return { direction: 'stable', change: 0, isSignificant: false };
  }

  // Compara primeira metade com segunda metade
  const midpoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midpoint);
  const secondHalf = values.slice(midpoint);

  const firstAvg = calculateAverage(firstHalf);
  const secondAvg = calculateAverage(secondHalf);

  const change = calculatePercentageChange(firstAvg, secondAvg);
  const direction = getTrendDirection(firstAvg, secondAvg);
  const isSignificant = Math.abs(change) >= 10; // 10% threshold

  return { direction, change, isSignificant };
}

/**
 * Calcula média de um array de números
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calcula mediana de um array de números
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Detecta anomalias (valores outliers) em uma série
 */
export function detectAnomalies(
  values: number[],
  threshold: number = 2
): number[] {
  if (values.length < 3) return [];

  const avg = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values);

  return values.filter(value => {
    const zScore = Math.abs((value - avg) / stdDev);
    return zScore > threshold;
  });
}

/**
 * Calcula desvio padrão
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const avg = calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = calculateAverage(squareDiffs);

  return Math.sqrt(avgSquareDiff);
}

// ==========================================
// FUNÇÕES DE NORMALIZAÇÃO DE DADOS
// ==========================================

/**
 * Normaliza valores para escala 0-1 (min-max normalization)
 */
export function normalizeMinMax(values: number[]): number[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range === 0) {
    return values.map(() => 0.5);
  }

  return values.map(value => (value - min) / range);
}

/**
 * Normaliza valores usando z-score
 */
export function normalizeZScore(values: number[]): number[] {
  if (values.length === 0) return [];

  const avg = calculateAverage(values);
  const stdDev = calculateStandardDeviation(values);

  if (stdDev === 0) {
    return values.map(() => 0);
  }

  return values.map(value => (value - avg) / stdDev);
}

/**
 * Agrupa valores em bins para histograma
 */
export function groupIntoBins(
  values: number[],
  binCount: number
): Array<{ min: number; max: number; count: number }> {
  if (values.length === 0 || binCount <= 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / binCount;

  const bins: Array<{ min: number; max: number; count: number }> = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = min + (i * binSize);
    const binMax = i === binCount - 1 ? max : binMin + binSize;

    const count = values.filter(v => v >= binMin && v <= binMax).length;

    bins.push({ min: binMin, max: binMax, count });
  }

  return bins;
}

/**
 * Remove valores nulos e inválidos de um array
 */
export function cleanNumericArray(
  values: Array<number | null | undefined>
): number[] {
  return values.filter((v): v is number =>
    v !== null && v !== undefined && !isNaN(v) && isFinite(v)
  );
}

/**
 * Calcula percentil de um valor em um array
 */
export function calculatePercentile(value: number, values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;

  return calculatePercentage(below, values.length, 0);
}

/**
 * Formata ranking como percentil (ex: "Top 25%")
 */
export function formatPercentileRanking(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  if (percentile >= 25) return 'Acima da Média';
  return 'Abaixo da Média';
}

// ==========================================
// FUNÇÕES DE AGGREGAÇÃO
// ==========================================

/**
 * Agrupa dados por período
 */
export function groupByPeriod<T>(
  data: T[],
  getDate: (item: T) => Date,
  period: TimePeriod
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  data.forEach(item => {
    const date = getDate(item);
    const cohortId = getCohortId(date, period);

    if (!groups.has(cohortId)) {
      groups.set(cohortId, []);
    }

    groups.get(cohortId)!.push(item);
  });

  return groups;
}

/**
 * Calcula taxa de crescimento entre períodos
 */
export function calculateGrowthRate(
  currentValue: number,
  previousValue: number,
  decimals: number = 2
): number {
  if (previousValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }

  const growth = ((currentValue - previousValue) / previousValue) * 100;
  return Number(growth.toFixed(decimals));
}

/**
 * Interpola valores faltantes em uma série temporal
 */
export function interpolateMissingValues(values: Array<number | null>): number[] {
  const result: number[] = [];
  let lastValidIndex = -1;
  let lastValidValue = 0;

  // Primeira passada: encontra último valor válido e preenche
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && values[i] !== undefined) {
      lastValidValue = values[i]!;
      lastValidIndex = i;
      result[i] = lastValidValue;
    } else {
      result[i] = lastValidIndex >= 0 ? lastValidValue : 0;
    }
  }

  return result;
}
