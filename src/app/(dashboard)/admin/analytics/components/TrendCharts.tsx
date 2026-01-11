'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { type Period } from '../page';
import { getTrendData } from '@/actions/analytics';

interface TrendChartsProps {
  period: Period;
}

interface TrendDataPoint {
  date: string;
  posts: number;
  challenges: number;
  events: number;
  newUsers: number;
}

type MetricType = 'all' | 'posts' | 'challenges' | 'events' | 'newUsers';

const METRIC_CONFIG: Record<MetricType, { label: string; color: string; dataKey?: string }> = {
  all: { label: 'Todas', color: '' },
  posts: { label: 'Posts', color: '#8b5cf6', dataKey: 'posts' },
  challenges: { label: 'Desafios', color: '#22c55e', dataKey: 'challenges' },
  events: { label: 'Eventos', color: '#f59e0b', dataKey: 'events' },
  newUsers: { label: 'Novos Usuários', color: '#06b6d4', dataKey: 'newUsers' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function TrendCharts({ period }: TrendChartsProps) {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<MetricType>('all');

  useEffect(() => {
    async function fetchTrends() {
      setIsLoading(true);
      try {
        const result = await getTrendData(period);
        if (result.success && result.data) {
          setTrendData(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar tendências:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrends();
  }, [period]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados de tendência disponíveis</p>
      </div>
    );
  }

  // Calcular totais para o resumo
  const totals = trendData.reduce(
    (acc, day) => ({
      posts: acc.posts + day.posts,
      challenges: acc.challenges + day.challenges,
      events: acc.events + day.events,
      newUsers: acc.newUsers + day.newUsers,
    }),
    { posts: 0, challenges: 0, events: 0, newUsers: 0 }
  );

  // Formatar dados para exibição
  const chartData = trendData.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  // Filtrar dados baseado na métrica selecionada
  const metricsToShow = activeMetric === 'all'
    ? ['posts', 'challenges', 'events', 'newUsers']
    : [activeMetric];

  return (
    <div className="space-y-4">
      {/* Filtros de métrica */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METRIC_CONFIG) as MetricType[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveMetric(key)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${activeMetric === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {METRIC_CONFIG[key].label}
          </button>
        ))}
      </div>

      {/* Resumo de totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['posts', 'challenges', 'events', 'newUsers'] as const).map((key) => {
          const config = METRIC_CONFIG[key];
          const isActive = activeMetric === 'all' || activeMetric === key;
          return (
            <div
              key={key}
              className={`
                p-3 rounded-lg transition-opacity
                ${isActive ? 'bg-gray-50' : 'bg-gray-50 opacity-50'}
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <p className="text-xs text-gray-500">{config.label}</p>
              </div>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {totals[key].toLocaleString('pt-BR')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Gráfico de área */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              {(['posts', 'challenges', 'events', 'newUsers'] as const).map((key) => (
                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={METRIC_CONFIG[key].color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={METRIC_CONFIG[key].color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              interval={period === '7d' ? 0 : period === '30d' ? 4 : 14}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              formatter={(value, name) => [
                (value as number).toLocaleString('pt-BR'),
                METRIC_CONFIG[name as MetricType]?.label || name,
              ]}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px' }}
            />
            {metricsToShow.map((key) => {
              const config = METRIC_CONFIG[key as MetricType];
              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={key}
                  stroke={config.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${key})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
