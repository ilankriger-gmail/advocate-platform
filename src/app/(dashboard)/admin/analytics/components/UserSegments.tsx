'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { type Period } from '../page';
import { getUserSegmentAnalysis } from '@/actions/analytics';

interface UserSegmentsProps {
  period: Period;
}

interface UserSegment {
  name: string;
  count: number;
  percentage: number;
  avgEngagement: number;
  [key: string]: string | number;
}

interface SegmentAnalysis {
  byRole: UserSegment[];
  byAdvocateLevel: UserSegment[];
  byTenure: UserSegment[];
  byEngagement: UserSegment[];
}

const COLORS = {
  primary: ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
  success: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
  warning: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
  danger: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'],
};

type SegmentType = 'byRole' | 'byAdvocateLevel' | 'byTenure' | 'byEngagement';

const SEGMENT_CONFIG: Record<SegmentType, { label: string; colors: string[] }> = {
  byRole: { label: 'Por Tipo', colors: COLORS.primary },
  byAdvocateLevel: { label: 'Por Nível', colors: COLORS.success },
  byTenure: { label: 'Por Tempo', colors: COLORS.warning },
  byEngagement: { label: 'Por Engajamento', colors: COLORS.danger },
};

export function UserSegments({ period }: UserSegmentsProps) {
  const [segments, setSegments] = useState<SegmentAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState<SegmentType>('byRole');

  useEffect(() => {
    async function fetchSegments() {
      setIsLoading(true);
      try {
        const result = await getUserSegmentAnalysis(period);
        if (result.success && result.data) {
          // Converter para formato com index signature para recharts
          const convertSegments = (segments: { name: string; count: number; percentage: number; avgEngagement: number }[]): UserSegment[] =>
            segments.map(s => ({ ...s }));

          setSegments({
            byRole: convertSegments(result.data.byRole),
            byAdvocateLevel: convertSegments(result.data.byAdvocateLevel),
            byTenure: convertSegments(result.data.byTenure),
            byEngagement: convertSegments(result.data.byEngagement),
          });
        }
      } catch (error) {
        console.error('Erro ao carregar segmentos:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSegments();
  }, [period]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!segments) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados de segmentação disponíveis</p>
      </div>
    );
  }

  const currentSegment = segments[activeSegment];
  const config = SEGMENT_CONFIG[activeSegment];

  return (
    <div className="space-y-4">
      {/* Tabs de segmento */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(SEGMENT_CONFIG) as SegmentType[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveSegment(key)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
              ${activeSegment === key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {SEGMENT_CONFIG[key].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pizza */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentSegment}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="count"
                nameKey="name"
              >
                {currentSegment.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={config.colors[index % config.colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${(value as number).toLocaleString('pt-BR')} usuários`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista detalhada */}
        <div className="space-y-2">
          {currentSegment.map((segment, index) => (
            <div
              key={segment.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: config.colors[index % config.colors.length] }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {segment.name}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {segment.count.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex-1 mr-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(segment.percentage, 100)}%`,
                          backgroundColor: config.colors[index % config.colors.length],
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 w-12 text-right">
                    {segment.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
