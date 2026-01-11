'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { type Period } from '../page';
import { getActivityBreakdown } from '@/actions/analytics';

interface ActivityBreakdownProps {
  period: Period;
}

interface ActivityData {
  category: string;
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
}

const CATEGORY_CONFIG = {
  posts: {
    label: 'Posts',
    color: '#8b5cf6',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  challenges: {
    label: 'Desafios',
    color: '#22c55e',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  events: {
    label: 'Eventos',
    color: '#f59e0b',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  rewards: {
    label: 'Resgates',
    color: '#ef4444',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function ActivityBreakdown({ period }: ActivityBreakdownProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      setIsLoading(true);
      try {
        const result = await getActivityBreakdown(period);
        if (result.success && result.data) {
          const data: ActivityData[] = Object.entries(result.data).map(([key, value]) => ({
            category: key,
            label: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]?.label || key,
            count: value as number,
            color: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]?.color || '#6b7280',
            icon: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG]?.icon,
          }));
          setActivities(data);
        }
      } catch (error) {
        console.error('Erro ao carregar atividades:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivities();
  }, [period]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Sem dados de atividades disponíveis</p>
      </div>
    );
  }

  const total = activities.reduce((sum, a) => sum + a.count, 0);

  return (
    <div className="space-y-4">
      {/* Gráfico de barras horizontal */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activities} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={80}
            />
            <Tooltip
              formatter={(value) => [(value as number).toLocaleString('pt-BR'), 'Total']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {activities.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cards com detalhes */}
      <div className="grid grid-cols-2 gap-3">
        {activities.map((activity) => {
          const percentage = total > 0 ? (activity.count / total) * 100 : 0;
          return (
            <div
              key={activity.category}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
            >
              <div
                className="p-2 rounded-lg text-white"
                style={{ backgroundColor: activity.color }}
              >
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.label}</p>
                <p className="text-xs text-gray-500">
                  {activity.count.toLocaleString('pt-BR')} ({percentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
