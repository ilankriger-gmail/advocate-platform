'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { type Period } from '../page';
import { getOverviewMetrics } from '@/actions/analytics';

interface OverviewCardsProps {
  period: Period;
}

interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalPosts: number;
  totalChallenges: number;
  completedChallenges: number;
  retentionRate: number;
  engagementRate: number;
  previousPeriod: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalPosts: number;
  };
}

const defaultMetrics: OverviewMetrics = {
  totalUsers: 0,
  activeUsers: 0,
  newUsers: 0,
  totalPosts: 0,
  totalChallenges: 0,
  completedChallenges: 0,
  retentionRate: 0,
  engagementRate: 0,
  previousPeriod: {
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    totalPosts: 0,
  },
};

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export function OverviewCards({ period }: OverviewCardsProps) {
  const [metrics, setMetrics] = useState<OverviewMetrics>(defaultMetrics);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      try {
        const result = await getOverviewMetrics(period);
        if (result.success && result.data) {
          setMetrics(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
  }, [period]);

  const cards = [
    {
      title: 'Usuários Ativos',
      value: metrics.activeUsers,
      change: calculateChange(metrics.activeUsers, metrics.previousPeriod.activeUsers),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Novos Usuários',
      value: metrics.newUsers,
      change: calculateChange(metrics.newUsers, metrics.previousPeriod.newUsers),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Posts Criados',
      value: metrics.totalPosts,
      change: calculateChange(metrics.totalPosts, metrics.previousPeriod.totalPosts),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Taxa de Retenção',
      value: `${metrics.retentionRate.toFixed(1)}%`,
      subtitle: 'D7',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      isPercentage: true,
    },
    {
      title: 'Desafios Completados',
      value: metrics.completedChallenges,
      total: metrics.totalChallenges,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Engajamento',
      value: `${metrics.engagementRate.toFixed(1)}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      isPercentage: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
              <span className={card.color}>{card.icon}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-1">{card.title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-gray-900">
              {typeof card.value === 'number' ? card.value.toLocaleString('pt-BR') : card.value}
            </p>
            {card.subtitle && (
              <span className="text-xs text-gray-400">{card.subtitle}</span>
            )}
            {card.total !== undefined && (
              <span className="text-xs text-gray-400">/ {card.total}</span>
            )}
          </div>
          {card.change !== undefined && !card.isPercentage && (
            <p className={`text-xs mt-1 ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(card.change)} vs período anterior
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
