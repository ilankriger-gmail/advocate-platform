'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type SortOrder = 'asc' | 'desc';
type RewardType = 'all' | 'physical' | 'digital' | 'money';

const TYPES = [
  { value: 'all', label: 'Todos', emoji: '🎁' },
  { value: 'physical', label: 'Físico', emoji: '📦' },
  { value: 'digital', label: 'Digital', emoji: '💻' },
  { value: 'money', label: 'Dinheiro', emoji: '💰' },
] as const;

interface RewardsFilterProps {
  currentSort: SortOrder;
  currentType: RewardType;
}

export function RewardsFilter({ currentSort, currentType }: RewardsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'asc' || value === 'all') {
      params.delete(key); // valores padrão não precisam estar na URL
    } else {
      params.set(key, value);
    }
    router.push(`/premios?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      {/* Filtro por tipo */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => updateParams('tipo', type.value)}
            className={`
              px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${currentType === type.value
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span className="mr-1">{type.emoji}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* Ordenação */}
      <div className="flex gap-2">
        <button
          onClick={() => updateParams('ordem', 'asc')}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${currentSort === 'asc'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          ↑ Menos ❤️
        </button>
        <button
          onClick={() => updateParams('ordem', 'desc')}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${currentSort === 'desc'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          ↓ Mais ❤️
        </button>
      </div>
    </div>
  );
}
