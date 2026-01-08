'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface LeadFiltersProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgScore: number;
  };
}

export function LeadFilters({ stats }: LeadFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get('status') || 'pending';
  const currentOrder = searchParams.get('orderBy') || 'created_at';

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/admin/leads?${params.toString()}`);
  }

  const statusTabs = [
    { key: 'pending', label: 'Pendentes', count: stats.pending, color: 'yellow' },
    { key: 'approved', label: 'Aprovados', count: stats.approved, color: 'green' },
    { key: 'rejected', label: 'Reprovados', count: stats.rejected, color: 'red' },
    { key: 'all', label: 'Todos', count: stats.total, color: 'gray' },
  ];

  const orderOptions = [
    { key: 'created_at', label: 'Data' },
    { key: 'score', label: 'Nota NPS' },
    { key: 'reason_length', label: 'Prolixidade' },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs de status */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const isActive = currentStatus === tab.key;
          const colorClasses = {
            yellow: isActive ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
            green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
            red: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
            gray: isActive ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          };

          return (
            <button
              key={tab.key}
              onClick={() => updateFilter('status', tab.key)}
              className={`
                px-4 py-2 rounded-xl font-medium text-sm
                transition-all duration-200
                ${colorClasses[tab.color as keyof typeof colorClasses]}
              `}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ordenacao e stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <select
            value={currentOrder}
            onChange={(e) => updateFilter('orderBy', e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500"
          >
            {orderOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            NPS Medio: <span className="font-semibold text-pink-600">{stats.avgScore}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
