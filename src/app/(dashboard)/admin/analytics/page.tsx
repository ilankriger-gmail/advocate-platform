'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { OverviewCards } from './components/OverviewCards';
import { CohortHeatmap } from './components/CohortHeatmap';
import { RetentionChart } from './components/RetentionChart';
import { EngagementFunnel } from './components/EngagementFunnel';
import { ActivityBreakdown } from './components/ActivityBreakdown';
import { UserSegments } from './components/UserSegments';
import { TrendCharts } from './components/TrendCharts';
import { PeriodSelector } from './components/PeriodSelector';
import { ExportButton } from './components/ExportButton';

export type Period = '7d' | '30d' | '90d';
export type TimePeriod = 'weekly' | 'monthly';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [cohortPeriod, setCohortPeriod] = useState<TimePeriod>('weekly');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Acompanhe o desempenho da sua comunidade
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector period={period} onChange={setPeriod} />
          <ExportButton period={period} cohortPeriod={cohortPeriod} />
        </div>
      </div>

      {/* Overview KPIs */}
      <OverviewCards period={period} />

      {/* Cohort Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cohort Heatmap */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Retenção por Cohort</h2>
              <p className="text-sm text-gray-500">Taxa de retorno por período de registro</p>
            </div>
            <select
              value={cohortPeriod}
              onChange={(e) => setCohortPeriod(e.target.value as TimePeriod)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          <CohortHeatmap period={cohortPeriod} />
        </Card>

        {/* Retention Curves */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Curvas de Retenção</h2>
            <p className="text-sm text-gray-500">Comparação entre cohorts ao longo do tempo</p>
          </div>
          <RetentionChart period={cohortPeriod} />
        </Card>
      </div>

      {/* Engagement Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Engagement Funnel */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Funil de Engajamento</h2>
            <p className="text-sm text-gray-500">Jornada do usuário na plataforma</p>
          </div>
          <EngagementFunnel period={period} />
        </Card>

        {/* Activity Breakdown */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Atividades por Categoria</h2>
            <p className="text-sm text-gray-500">Distribuição de engajamento</p>
          </div>
          <ActivityBreakdown period={period} />
        </Card>
      </div>

      {/* Trends Section */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tendências</h2>
          <p className="text-sm text-gray-500">Evolução das métricas ao longo do tempo</p>
        </div>
        <TrendCharts period={period} />
      </Card>

      {/* User Segments */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Segmentação de Usuários</h2>
          <p className="text-sm text-gray-500">Análise por perfil de usuário</p>
        </div>
        <UserSegments period={period} />
      </Card>
    </div>
  );
}
