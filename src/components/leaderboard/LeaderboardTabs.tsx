'use client';

import { TimePeriod } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

/**
 * Interface de abas para alternar entre visualizações semanal, mensal e total
 * Exibe indicadores de intervalo de datas para cada período
 */

interface LeaderboardTabsProps {
  activePeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

/**
 * Retorna o texto descritivo para cada período
 */
function getPeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'weekly':
      return 'Semanal';
    case 'monthly':
      return 'Mensal';
    case 'all_time':
      return 'Todo o Tempo';
    default:
      return period;
  }
}

/**
 * Retorna a descrição/intervalo de datas para cada período
 */
function getPeriodDescription(period: TimePeriod): string {
  const now = new Date();

  switch (period) {
    case 'weekly': {
      // Últimos 7 dias
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      return `Últimos 7 dias`;
    }
    case 'monthly': {
      // Últimos 30 dias
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      return `Últimos 30 dias`;
    }
    case 'all_time':
      return 'Desde o início';
    default:
      return '';
  }
}

/**
 * Retorna o ícone SVG para cada período
 */
function getPeriodIcon(period: TimePeriod) {
  switch (period) {
    case 'weekly':
      return (
        <svg
          className="w-4 h-4"
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
    case 'monthly':
      return (
        <svg
          className="w-4 h-4"
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
    case 'all_time':
      return (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
  }
}

export function LeaderboardTabs({
  activePeriod,
  onPeriodChange,
  className,
}: LeaderboardTabsProps) {
  const periods: TimePeriod[] = ['weekly', 'monthly', 'all_time'];

  return (
    <div className={cn('w-full', className)}>
      {/* Tabs container */}
      <div className="border-b border-surface-200">
        <div className="flex flex-wrap gap-1 -mb-px" role="tablist">
          {periods.map((period) => {
            const isActive = activePeriod === period;

            return (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${period}`}
                onClick={() => onPeriodChange(period)}
                className={cn(
                  'group flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-t-lg',
                  'min-w-[140px] justify-center',
                  isActive
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50 border-b-2 border-transparent'
                )}
              >
                {/* Ícone */}
                <span
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600'
                  )}
                >
                  {getPeriodIcon(period)}
                </span>

                {/* Label e descrição */}
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{getPeriodLabel(period)}</span>
                  <span
                    className={cn(
                      'text-xs font-normal',
                      isActive ? 'text-primary-500' : 'text-surface-400'
                    )}
                  >
                    {getPeriodDescription(period)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Informação adicional sobre o período ativo */}
      <div className="mt-3 px-1">
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
          <span>
            {activePeriod === 'weekly' && 'Rankings baseados nas atividades dos últimos 7 dias'}
            {activePeriod === 'monthly' && 'Rankings baseados nas atividades dos últimos 30 dias'}
            {activePeriod === 'all_time' && 'Rankings considerando todas as atividades desde o início'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Variante compacta do LeaderboardTabs para widgets/previews
 * Versão simplificada sem descrições detalhadas
 */
export function LeaderboardTabsCompact({
  activePeriod,
  onPeriodChange,
  className,
}: LeaderboardTabsProps) {
  const periods: TimePeriod[] = ['weekly', 'monthly', 'all_time'];

  return (
    <div className={cn('w-full', className)}>
      {/* Tabs compactos */}
      <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
        {periods.map((period) => {
          const isActive = activePeriod === period;

          return (
            <button
              key={period}
              type="button"
              onClick={() => onPeriodChange(period)}
              className={cn(
                'flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                isActive
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-surface-600 hover:text-surface-800 hover:bg-surface-200/50'
              )}
            >
              {getPeriodLabel(period)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Exportar variante compacta como propriedade do componente principal
LeaderboardTabs.Compact = LeaderboardTabsCompact;
