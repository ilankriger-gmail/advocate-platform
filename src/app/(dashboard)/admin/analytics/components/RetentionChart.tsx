'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { type TimePeriod } from '../page';
import { getCohortAnalysis } from '@/actions/analytics';
import type { CohortData } from '@/types/analytics';

interface RetentionChartProps {
  period: TimePeriod;
}

const COLORS = [
  '#6366f1', // indigo
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

interface ChartDataPoint {
  period: number;
  periodLabel: string;
  [key: string]: number | string;
}

export function RetentionChart({ period }: RetentionChartProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCohorts() {
      setIsLoading(true);
      try {
        const result = await getCohortAnalysis(period, 4, 6);
        if (result.success && result.data) {
          setCohorts(result.data.cohorts);
        }
      } catch (error) {
        console.error('Erro ao carregar cohorts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCohorts();
  }, [period]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados de retenção disponíveis</p>
      </div>
    );
  }

  // Transformar dados para o formato do gráfico
  const periodLabel = period === 'weekly' ? 'Semana' : 'Mês';
  const maxPeriods = Math.max(...cohorts.map(c => Object.keys(c.retention_rates).length));

  const chartData: ChartDataPoint[] = [...Array(maxPeriods)].map((_, i) => {
    const dataPoint: ChartDataPoint = {
      period: i,
      periodLabel: i === 0 ? `${periodLabel} 0` : `+${i}`,
    };

    cohorts.forEach((cohort) => {
      const label = cohort.cohort_label || (() => {
        const date = new Date(cohort.cohort_date);
        return period === 'weekly'
          ? `${date.toLocaleString('pt-BR', { month: 'short' })} S${Math.ceil(date.getDate() / 7)}`
          : date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      })();

      const value = cohort.retention_rates[i];
      if (value !== undefined) {
        dataPoint[label] = value;
      }
    });

    return dataPoint;
  });

  // Gerar labels para a legenda
  const cohortLabels = cohorts.map((cohort) => {
    if (cohort.cohort_label) return cohort.cohort_label;
    const date = new Date(cohort.cohort_date);
    return period === 'weekly'
      ? `${date.toLocaleString('pt-BR', { month: 'short' })} S${Math.ceil(date.getDate() / 7)}`
      : date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Retenção']}
            labelFormatter={(label) => `Período: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          {cohortLabels.map((label, index) => (
            <Line
              key={label}
              type="monotone"
              dataKey={label}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
