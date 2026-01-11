'use client';

import { useState, useEffect } from 'react';
import { type TimePeriod } from '../page';
import { getCohortAnalysis } from '@/actions/analytics';
import type { CohortData } from '@/types/analytics';

interface CohortHeatmapProps {
  period: TimePeriod;
}

function getRetentionColor(value: number | undefined): string {
  if (value === undefined || value === null) return 'bg-gray-100';
  if (value >= 60) return 'bg-green-500 text-white';
  if (value >= 40) return 'bg-green-400 text-white';
  if (value >= 30) return 'bg-yellow-400 text-gray-900';
  if (value >= 20) return 'bg-orange-400 text-white';
  if (value >= 10) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

function formatCohortLabel(cohort: CohortData, period: TimePeriod): string {
  // Usar cohort_label se disponível, senão formatar a data
  if (cohort.cohort_label) {
    return cohort.cohort_label;
  }
  const date = new Date(cohort.cohort_date);
  if (period === 'weekly') {
    const weekNum = Math.ceil(date.getDate() / 7);
    return `${date.toLocaleString('pt-BR', { month: 'short' })} S${weekNum}`;
  }
  return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

export function CohortHeatmap({ period }: CohortHeatmapProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [avgRetention, setAvgRetention] = useState({ period1: 0, period3: 0 });

  useEffect(() => {
    async function fetchCohorts() {
      setIsLoading(true);
      try {
        const result = await getCohortAnalysis(period, 6, 6);
        if (result.success && result.data) {
          setCohorts(result.data.cohorts);
          setAvgRetention({
            period1: result.data.avg_retention_period_1,
            period3: result.data.avg_retention_period_3,
          });
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
        <p>Sem dados de cohort disponíveis</p>
      </div>
    );
  }

  const periodLabel = period === 'weekly' ? 'Semana' : 'Mês';
  const maxPeriods = Math.max(...cohorts.map(c => Object.keys(c.retention_rates).length));

  return (
    <div className="space-y-4">
      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span>Baixa</span>
          <div className="flex">
            <div className="w-4 h-4 bg-red-500 rounded-l" />
            <div className="w-4 h-4 bg-orange-500" />
            <div className="w-4 h-4 bg-yellow-400" />
            <div className="w-4 h-4 bg-green-400" />
            <div className="w-4 h-4 bg-green-500 rounded-r" />
          </div>
          <span>Alta</span>
        </div>
        <div className="ml-auto flex gap-4">
          <span>Retenção {periodLabel} 1: <strong>{avgRetention.period1.toFixed(1)}%</strong></span>
          <span>Retenção {periodLabel} 3: <strong>{avgRetention.period3.toFixed(1)}%</strong></span>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Cohort</th>
              <th className="text-center py-2 px-2 font-medium text-gray-500">Usuários</th>
              {[...Array(maxPeriods)].map((_, i) => (
                <th key={i} className="text-center py-2 px-2 font-medium text-gray-500">
                  {i === 0 ? periodLabel + ' 0' : `+${i}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort, rowIndex) => (
              <tr key={rowIndex} className="border-t border-gray-100">
                <td className="py-2 px-3 font-medium text-gray-700">
                  {formatCohortLabel(cohort, period)}
                </td>
                <td className="text-center py-2 px-2 text-gray-600">
                  {cohort.size}
                </td>
                {[...Array(maxPeriods)].map((_, colIndex) => {
                  const value = cohort.retention_rates[colIndex];
                  const isCurrentPeriod = colIndex === Object.keys(cohort.retention_rates).length - 1 && value !== undefined;

                  return (
                    <td key={colIndex} className="p-1">
                      {value !== undefined ? (
                        <div
                          className={`
                            py-2 px-2 rounded text-center text-xs font-medium
                            ${getRetentionColor(value)}
                            ${isCurrentPeriod ? 'ring-2 ring-blue-300' : ''}
                          `}
                          title={`${value.toFixed(1)}% (${Math.round(cohort.size * value / 100)} usuários)`}
                        >
                          {value.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="py-2 px-2 rounded text-center text-xs bg-gray-50 text-gray-300">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
