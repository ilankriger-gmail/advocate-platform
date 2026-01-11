'use client';

import { useState, useRef, useEffect } from 'react';
import { type Period, type TimePeriod } from '../page';
import {
  getCohortAnalysis,
  getEngagementFunnel,
  getActivityBreakdown,
  getUserSegmentAnalysis,
  getTrendData,
  getOverviewMetrics,
} from '@/actions/analytics';
import {
  exportToCSV,
  formatDateForFilename,
  formatCohortDataForExport,
  formatTrendDataForExport,
  formatSegmentDataForExport,
  downloadCSV,
  arrayToCSV,
} from '@/lib/export';

interface ExportButtonProps {
  period: Period;
  cohortPeriod: TimePeriod;
}

type ExportType = 'all' | 'overview' | 'cohort' | 'funnel' | 'activities' | 'segments' | 'trends';

const EXPORT_OPTIONS: { type: ExportType; label: string }[] = [
  { type: 'all', label: 'Exportar Tudo' },
  { type: 'overview', label: 'Overview (KPIs)' },
  { type: 'cohort', label: 'Cohort Analysis' },
  { type: 'funnel', label: 'Funil de Engajamento' },
  { type: 'activities', label: 'Atividades' },
  { type: 'segments', label: 'Segmentos' },
  { type: 'trends', label: 'Tendências' },
];

export function ExportButton({ period, cohortPeriod }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (type: ExportType) => {
    setIsExporting(true);
    setIsOpen(false);

    const dateStr = formatDateForFilename();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;

    try {
      if (type === 'all') {
        // Exportar todos os dados em um único arquivo
        await exportAll(period, cohortPeriod, periodDays, dateStr);
      } else if (type === 'overview') {
        await exportOverview(period, dateStr);
      } else if (type === 'cohort') {
        await exportCohort(cohortPeriod, dateStr);
      } else if (type === 'funnel') {
        await exportFunnel(periodDays, dateStr);
      } else if (type === 'activities') {
        await exportActivities(period, dateStr);
      } else if (type === 'segments') {
        await exportSegments(period, dateStr);
      } else if (type === 'trends') {
        await exportTrends(period, dateStr);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`
          flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
          transition-colors border
          ${isExporting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }
        `}
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Exportando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
            <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.type}
              onClick={() => handleExport(option.type)}
              className={`
                w-full text-left px-4 py-2 text-sm hover:bg-gray-50
                ${option.type === 'all' ? 'text-indigo-600 font-medium border-b border-gray-100' : 'text-gray-700'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Funções de exportação

async function exportOverview(period: Period, dateStr: string) {
  const result = await getOverviewMetrics(period);
  if (!result.success || !result.data) return;

  const data = [
    { metrica: 'Total de Usuários', valor: result.data.totalUsers },
    { metrica: 'Usuários Ativos', valor: result.data.activeUsers },
    { metrica: 'Novos Usuários', valor: result.data.newUsers },
    { metrica: 'Posts Criados', valor: result.data.totalPosts },
    { metrica: 'Desafios (Total)', valor: result.data.totalChallenges },
    { metrica: 'Desafios Completados', valor: result.data.completedChallenges },
    { metrica: 'Taxa de Retenção (%)', valor: result.data.retentionRate.toFixed(1) },
    { metrica: 'Taxa de Engajamento (%)', valor: result.data.engagementRate.toFixed(1) },
  ];

  exportToCSV(data, `analytics-overview-${period}-${dateStr}`, [
    { key: 'metrica', label: 'Métrica' },
    { key: 'valor', label: 'Valor' },
  ]);
}

async function exportCohort(cohortPeriod: TimePeriod, dateStr: string) {
  const result = await getCohortAnalysis(cohortPeriod, 6, 6);
  if (!result.success || !result.data) return;

  const data = formatCohortDataForExport(result.data.cohorts);
  downloadCSV(arrayToCSV(data), `analytics-cohort-${cohortPeriod}-${dateStr}.csv`);
}

async function exportFunnel(periodDays: number, dateStr: string) {
  const result = await getEngagementFunnel(periodDays);
  if (!result.success || !result.data) return;

  const data = result.data.stages.map(stage => ({
    estagio: stage.label,
    usuarios: stage.count,
    taxa_conversao: `${stage.conversion_rate.toFixed(1)}%`,
    percentual_total: `${stage.percentage_of_total.toFixed(1)}%`,
  }));

  exportToCSV(data, `analytics-funnel-${periodDays}d-${dateStr}`, [
    { key: 'estagio', label: 'Estágio' },
    { key: 'usuarios', label: 'Usuários' },
    { key: 'taxa_conversao', label: 'Taxa de Conversão' },
    { key: 'percentual_total', label: '% do Total' },
  ]);
}

async function exportActivities(period: Period, dateStr: string) {
  const result = await getActivityBreakdown(period);
  if (!result.success || !result.data) return;

  const total = result.data.posts + result.data.challenges + result.data.events + result.data.rewards;

  const data = [
    { categoria: 'Posts', quantidade: result.data.posts, percentual: `${((result.data.posts / total) * 100).toFixed(1)}%` },
    { categoria: 'Desafios', quantidade: result.data.challenges, percentual: `${((result.data.challenges / total) * 100).toFixed(1)}%` },
    { categoria: 'Eventos', quantidade: result.data.events, percentual: `${((result.data.events / total) * 100).toFixed(1)}%` },
    { categoria: 'Resgates', quantidade: result.data.rewards, percentual: `${((result.data.rewards / total) * 100).toFixed(1)}%` },
  ];

  exportToCSV(data, `analytics-atividades-${period}-${dateStr}`, [
    { key: 'categoria', label: 'Categoria' },
    { key: 'quantidade', label: 'Quantidade' },
    { key: 'percentual', label: 'Percentual' },
  ]);
}

async function exportSegments(period: Period, dateStr: string) {
  const result = await getUserSegmentAnalysis(period);
  if (!result.success || !result.data) return;

  const allSegments = [
    ...formatSegmentDataForExport(result.data.byRole, 'Por Tipo'),
    ...formatSegmentDataForExport(result.data.byAdvocateLevel, 'Por Nível'),
    ...formatSegmentDataForExport(result.data.byTenure, 'Por Tempo'),
    ...formatSegmentDataForExport(result.data.byEngagement, 'Por Engajamento'),
  ];

  downloadCSV(arrayToCSV(allSegments), `analytics-segmentos-${period}-${dateStr}.csv`);
}

async function exportTrends(period: Period, dateStr: string) {
  const result = await getTrendData(period);
  if (!result.success || !result.data) return;

  const data = formatTrendDataForExport(result.data);
  downloadCSV(arrayToCSV(data), `analytics-tendencias-${period}-${dateStr}.csv`);
}

async function exportAll(
  period: Period,
  cohortPeriod: TimePeriod,
  periodDays: number,
  dateStr: string
) {
  // Buscar todos os dados em paralelo
  const [overview, cohort, funnel, activities, segments, trends] = await Promise.all([
    getOverviewMetrics(period),
    getCohortAnalysis(cohortPeriod, 6, 6),
    getEngagementFunnel(periodDays),
    getActivityBreakdown(period),
    getUserSegmentAnalysis(period),
    getTrendData(period),
  ]);

  let csvContent = '';

  // Overview
  csvContent += '=== OVERVIEW ===\n';
  if (overview.success && overview.data) {
    csvContent += 'Métrica,Valor\n';
    csvContent += `Total de Usuários,${overview.data.totalUsers}\n`;
    csvContent += `Usuários Ativos,${overview.data.activeUsers}\n`;
    csvContent += `Novos Usuários,${overview.data.newUsers}\n`;
    csvContent += `Posts Criados,${overview.data.totalPosts}\n`;
    csvContent += `Desafios (Total),${overview.data.totalChallenges}\n`;
    csvContent += `Desafios Completados,${overview.data.completedChallenges}\n`;
    csvContent += `Taxa de Retenção (%),${overview.data.retentionRate.toFixed(1)}\n`;
    csvContent += `Taxa de Engajamento (%),${overview.data.engagementRate.toFixed(1)}\n`;
  }

  // Cohort
  csvContent += '\n=== COHORT ANALYSIS ===\n';
  if (cohort.success && cohort.data) {
    const cohortData = formatCohortDataForExport(cohort.data.cohorts);
    csvContent += arrayToCSV(cohortData) + '\n';
  }

  // Funnel
  csvContent += '\n=== FUNIL DE ENGAJAMENTO ===\n';
  if (funnel.success && funnel.data) {
    csvContent += 'Estágio,Usuários,Taxa de Conversão,% do Total\n';
    funnel.data.stages.forEach(stage => {
      csvContent += `${stage.label},${stage.count},${stage.conversion_rate.toFixed(1)}%,${stage.percentage_of_total.toFixed(1)}%\n`;
    });
  }

  // Activities
  csvContent += '\n=== ATIVIDADES ===\n';
  if (activities.success && activities.data) {
    csvContent += 'Categoria,Quantidade\n';
    csvContent += `Posts,${activities.data.posts}\n`;
    csvContent += `Desafios,${activities.data.challenges}\n`;
    csvContent += `Eventos,${activities.data.events}\n`;
    csvContent += `Resgates,${activities.data.rewards}\n`;
  }

  // Segments
  csvContent += '\n=== SEGMENTOS ===\n';
  if (segments.success && segments.data) {
    const allSegments = [
      ...formatSegmentDataForExport(segments.data.byRole, 'Por Tipo'),
      ...formatSegmentDataForExport(segments.data.byAdvocateLevel, 'Por Nível'),
      ...formatSegmentDataForExport(segments.data.byTenure, 'Por Tempo'),
      ...formatSegmentDataForExport(segments.data.byEngagement, 'Por Engajamento'),
    ];
    csvContent += arrayToCSV(allSegments) + '\n';
  }

  // Trends
  csvContent += '\n=== TENDÊNCIAS ===\n';
  if (trends.success && trends.data) {
    const trendData = formatTrendDataForExport(trends.data);
    csvContent += arrayToCSV(trendData) + '\n';
  }

  downloadCSV(csvContent, `analytics-completo-${period}-${dateStr}.csv`);
}
