'use client';

import { LeaderboardCategory } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

/**
 * Interface de seleção de categoria do leaderboard
 * Permite alternar entre moedas, desafios, eventos e ranking geral
 */

interface CategorySelectorProps {
  activeCategory: LeaderboardCategory;
  onCategoryChange: (category: LeaderboardCategory) => void;
  className?: string;
}

/**
 * Retorna o texto descritivo para cada categoria
 */
function getCategoryLabel(category: LeaderboardCategory): string {
  switch (category) {
    case 'coins':
      return 'Moedas';
    case 'challenges':
      return 'Desafios';
    case 'events':
      return 'Eventos';
    case 'combined':
      return 'Geral';
    default:
      return category;
  }
}

/**
 * Retorna a descrição para cada categoria
 */
function getCategoryDescription(category: LeaderboardCategory): string {
  switch (category) {
    case 'coins':
      return 'Ranking por moedas ganhas';
    case 'challenges':
      return 'Ranking por desafios completados';
    case 'events':
      return 'Ranking por eventos participados';
    case 'combined':
      return 'Ranking geral combinado';
    default:
      return '';
  }
}

/**
 * Retorna o ícone SVG para cada categoria
 */
function getCategoryIcon(category: LeaderboardCategory) {
  switch (category) {
    case 'coins':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'challenges':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      );
    case 'events':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case 'combined':
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
  }
}

export function CategorySelector({
  activeCategory,
  onCategoryChange,
  className,
}: CategorySelectorProps) {
  const categories: LeaderboardCategory[] = ['coins', 'challenges', 'events', 'combined'];

  return (
    <div className={cn('w-full', className)}>
      {/* Grid de categorias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={cn(
                'group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'border-2',
                isActive
                  ? 'bg-primary-50 border-primary-500 shadow-md'
                  : 'bg-white border-surface-200 hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-sm'
              )}
            >
              {/* Ícone */}
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-surface-100 text-surface-500 group-hover:bg-primary-100/50 group-hover:text-primary-500'
                )}
              >
                {getCategoryIcon(category)}
              </div>

              {/* Label */}
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'font-semibold text-sm',
                    isActive ? 'text-primary-700' : 'text-surface-700 group-hover:text-primary-600'
                  )}
                >
                  {getCategoryLabel(category)}
                </span>
                <span
                  className={cn(
                    'text-xs mt-0.5',
                    isActive ? 'text-primary-600' : 'text-surface-500'
                  )}
                >
                  {getCategoryDescription(category).replace('Ranking por ', '')}
                </span>
              </div>

              {/* Indicador de seleção */}
              {isActive && (
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Informação sobre a categoria ativa */}
      <div className="mt-4 px-1">
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{getCategoryDescription(activeCategory)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Variante compacta do CategorySelector para widgets/previews
 * Versão simplificada com tabs horizontais
 */
export function CategorySelectorCompact({
  activeCategory,
  onCategoryChange,
  className,
}: CategorySelectorProps) {
  const categories: LeaderboardCategory[] = ['coins', 'challenges', 'events', 'combined'];

  return (
    <div className={cn('w-full', className)}>
      {/* Tabs horizontais compactos */}
      <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1 overflow-x-auto">
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                isActive
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-800 hover:bg-surface-200/50'
              )}
            >
              <span className="w-4 h-4">{getCategoryIcon(category)}</span>
              <span>{getCategoryLabel(category)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Exportar variante compacta como propriedade do componente principal
CategorySelector.Compact = CategorySelectorCompact;
