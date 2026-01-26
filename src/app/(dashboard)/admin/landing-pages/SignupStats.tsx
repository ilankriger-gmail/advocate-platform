'use client';

import { Card } from '@/components/ui';
import { Users, TrendingUp, Clock, Target } from 'lucide-react';

interface LandingPageStat {
  signup_source: string;
  signup_source_id: string | null;
  signup_source_name: string | null;
  total_signups: number;
  signups_24h: number;
  signups_7d: number;
  first_signup: string;
  last_signup: string;
}

interface SignupStatsProps {
  stats: LandingPageStat[];
  totals: {
    total: number;
    last24h: number;
    last7d: number;
    fromLandings: number;
    organic: number;
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    'landing_challenge': '🎯 Desafio (NPS)',
    'landing_challenge_direto': '🎯 Desafio (Direto)',
    'landing_reward': '🎁 Prêmio (NPS)',
    'landing_reward_direto': '🎁 Prêmio (Direto)',
  };
  return labels[source] || source;
}

export function SignupStats({ stats, totals }: SignupStatsProps) {
  const organicPercent = totals.total > 0 
    ? Math.round((totals.organic / totals.total) * 100) 
    : 0;
  const landingsPercent = totals.total > 0 
    ? Math.round((totals.fromLandings / totals.total) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Origem dos Inscritos</h2>
          <p className="text-gray-500 text-sm">Quais landing pages trouxeram mais membros</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-2xl font-bold text-blue-700">{totals.total}</span>
          </div>
          <p className="text-xs text-blue-600">Total Inscritos</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-2xl font-bold text-green-700">{totals.last24h}</span>
          </div>
          <p className="text-xs text-green-600">Últimas 24h</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-2xl font-bold text-purple-700">{totals.last7d}</span>
          </div>
          <p className="text-xs text-purple-600">Últimos 7 dias</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-pink-600" />
            <span className="text-2xl font-bold text-pink-700">{totals.fromLandings}</span>
          </div>
          <p className="text-xs text-pink-600">Via Landing ({landingsPercent}%)</p>
        </Card>
        
        <Card className="p-3 bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-2xl font-bold text-gray-700">{totals.organic}</span>
          </div>
          <p className="text-xs text-gray-600">Orgânico ({organicPercent}%)</p>
        </Card>
      </div>

      {/* Table */}
      {stats.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Landing Page</th>
                  <th className="text-center p-3 font-medium text-gray-700">Tipo</th>
                  <th className="text-center p-3 font-medium text-gray-700">Total</th>
                  <th className="text-center p-3 font-medium text-gray-700">24h</th>
                  <th className="text-center p-3 font-medium text-gray-700">7d</th>
                  <th className="text-center p-3 font-medium text-gray-700">Último</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.map((stat, index) => (
                  <tr key={`${stat.signup_source}-${stat.signup_source_id}-${index}`} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        {stat.signup_source_name || 'Sem nome'}
                      </div>
                      {stat.signup_source_id && (
                        <div className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                          {stat.signup_source_id}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-xs whitespace-nowrap">
                        {getSourceLabel(stat.signup_source)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-gray-900">{stat.total_signups}</span>
                    </td>
                    <td className="p-3 text-center">
                      {stat.signups_24h > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          +{stat.signups_24h}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {stat.signups_7d > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          +{stat.signups_7d}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center text-xs text-gray-500">
                      {formatDate(stat.last_signup)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-500">
            Nenhum inscrito rastreado ainda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            As estatísticas aparecerão quando usuários se inscreverem via landing pages.
          </p>
        </Card>
      )}
    </div>
  );
}
