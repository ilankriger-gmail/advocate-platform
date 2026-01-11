'use client';

import { useState, useEffect } from 'react';
import { type Period } from '../page';
import { getEngagementFunnel } from '@/actions/analytics';
import type { EngagementFunnel as EngagementFunnelType, FunnelStage } from '@/types/analytics';

interface EngagementFunnelProps {
  period: Period;
}

const STAGE_COLORS = {
  view: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
  participate: { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700' },
  complete: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
  return: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700' },
};

const STAGE_ICONS = {
  view: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  participate: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  complete: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  return: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export function EngagementFunnel({ period }: EngagementFunnelProps) {
  const [funnel, setFunnel] = useState<EngagementFunnelType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFunnel() {
      setIsLoading(true);
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;

      try {
        const result = await getEngagementFunnel(periodDays);
        if (result.success && result.data) {
          setFunnel(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar funil:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFunnel();
  }, [period]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    );
  }

  if (!funnel || funnel.stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados de engajamento disponíveis</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Funil Visual */}
      <div className="space-y-2">
        {funnel.stages.map((stage, index) => {
          const colors = STAGE_COLORS[stage.stage as keyof typeof STAGE_COLORS];
          const icon = STAGE_ICONS[stage.stage as keyof typeof STAGE_ICONS];
          const widthPercent = Math.max(30, stage.percentage_of_total);
          const nextStage = funnel.stages[index + 1];
          const dropoff = nextStage ? stage.count - nextStage.count : 0;

          return (
            <div key={stage.stage} className="relative">
              {/* Barra do funil */}
              <div
                className={`
                  ${colors.bg} rounded-lg p-4 flex items-center justify-between
                  transition-all duration-300 hover:opacity-90
                `}
                style={{ width: `${widthPercent}%` }}
              >
                <div className="flex items-center gap-3 text-white">
                  {icon}
                  <div>
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-xs opacity-80">{stage.count.toLocaleString('pt-BR')} usuários</p>
                  </div>
                </div>
                <div className="text-right text-white">
                  <p className="text-xl font-bold">{stage.percentage_of_total.toFixed(0)}%</p>
                  {index > 0 && (
                    <p className="text-xs opacity-80">
                      {stage.conversion_rate.toFixed(0)}% do anterior
                    </p>
                  )}
                </div>
              </div>

              {/* Indicador de drop-off */}
              {nextStage && dropoff > 0 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full flex items-center gap-1 text-xs text-red-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>-{dropoff.toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Métricas resumo */}
      <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {funnel.overall_conversion_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Conversão Geral</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-500">
            {funnel.biggest_dropoff_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">
            Maior Drop-off ({funnel.biggest_dropoff_stage})
          </p>
        </div>
      </div>
    </div>
  );
}
