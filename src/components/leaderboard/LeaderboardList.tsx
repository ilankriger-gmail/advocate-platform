'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeaderboardEntry } from './LeaderboardEntry';
import { LeaderboardEntry as LeaderboardEntryType } from '@/lib/supabase/types';

/**
 * Componente para exibir lista de entradas do leaderboard com suporte a paginação
 * Permite selecionar entre top 10/25/50 fãs
 */

interface LeaderboardListProps {
  entries: LeaderboardEntryType[];
  currentUserId?: string | null;
  isLoading?: boolean;
  showLastActivity?: boolean;
  defaultLimit?: 10 | 25 | 50;
  className?: string;
}

/**
 * Componente de skeleton para loading state
 */
function LeaderboardEntrySkeleton() {
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      {/* Lado esquerdo */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Rank placeholder */}
        <div className="w-10 h-6 bg-surface-200 rounded shrink-0" />

        {/* Avatar placeholder */}
        <div className="w-10 h-10 bg-surface-200 rounded-full shrink-0" />

        {/* Nome placeholder */}
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-surface-200 rounded w-32 mb-1" />
          <div className="h-3 bg-surface-200 rounded w-20" />
        </div>
      </div>

      {/* Lado direito */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Pontuação placeholder */}
        <div className="text-right">
          <div className="h-6 bg-surface-200 rounded w-16 mb-1" />
          <div className="h-3 bg-surface-200 rounded w-12" />
        </div>

        {/* Badge placeholder */}
        <div className="w-16 h-8 bg-surface-200 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Estado vazio quando não há dados
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">🏆</div>
      <h3 className="text-lg font-semibold text-surface-900 mb-2">
        Nenhum participante ainda
      </h3>
      <p className="text-sm text-surface-500 max-w-sm">
        Seja o primeiro a participar e aparecer no ranking! Complete desafios,
        participe de eventos e ganhe moedas para subir no leaderboard.
      </p>
    </div>
  );
}

export function LeaderboardList({
  entries,
  currentUserId,
  isLoading = false,
  showLastActivity = false,
  defaultLimit = 10,
  className,
}: LeaderboardListProps) {
  const [displayLimit, setDisplayLimit] = useState<10 | 25 | 50>(defaultLimit);

  // Se estiver carregando, mostrar skeletons
  if (isLoading) {
    return (
      <Card padding="none" className={cn('overflow-hidden', className)}>
        <div className="divide-y divide-surface-100">
          {Array.from({ length: displayLimit }).map((_, index) => (
            <LeaderboardEntrySkeleton key={index} />
          ))}
        </div>
      </Card>
    );
  }

  // Se não houver entradas, mostrar empty state
  if (entries.length === 0) {
    return (
      <Card className={cn('', className)}>
        <EmptyState />
      </Card>
    );
  }

  // Limitar entradas ao número selecionado
  const displayedEntries = entries.slice(0, displayLimit);
  const hasMoreEntries = entries.length > displayLimit;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controles de paginação - Top */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-surface-700">Mostrar:</span>
          <div className="flex items-center gap-1 bg-surface-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={displayLimit === 10 ? 'primary' : 'ghost'}
              onClick={() => setDisplayLimit(10)}
              className={cn(
                'min-w-[60px] rounded-md',
                displayLimit === 10 ? '' : 'hover:bg-surface-200'
              )}
            >
              Top 10
            </Button>
            <Button
              size="sm"
              variant={displayLimit === 25 ? 'primary' : 'ghost'}
              onClick={() => setDisplayLimit(25)}
              className={cn(
                'min-w-[60px] rounded-md',
                displayLimit === 25 ? '' : 'hover:bg-surface-200'
              )}
            >
              Top 25
            </Button>
            <Button
              size="sm"
              variant={displayLimit === 50 ? 'primary' : 'ghost'}
              onClick={() => setDisplayLimit(50)}
              className={cn(
                'min-w-[60px] rounded-md',
                displayLimit === 50 ? '' : 'hover:bg-surface-200'
              )}
            >
              Top 50
            </Button>
          </div>
        </div>

        <div className="text-sm text-surface-500">
          {displayedEntries.length} de {entries.length} participantes
        </div>
      </div>

      {/* Lista de entradas */}
      <Card padding="none" className="overflow-hidden">
        <div className="divide-y divide-surface-100">
          {displayedEntries.map((entry, index) => (
            <LeaderboardEntry
              key={entry.user_id}
              entry={entry}
              position={index}
              currentUserId={currentUserId}
              showLastActivity={showLastActivity}
            />
          ))}
        </div>

        {/* Indicador de mais entradas */}
        {hasMoreEntries && (
          <div className="bg-surface-50 px-4 py-3 text-center border-t border-surface-100">
            <p className="text-sm text-surface-600">
              +{entries.length - displayLimit} participantes não exibidos
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Selecione "Top 25" ou "Top 50" para ver mais
            </p>
          </div>
        )}
      </Card>

      {/* Informação adicional - responsivo */}
      <div className="flex items-center justify-center gap-2 text-xs text-surface-500">
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Os rankings são atualizados em tempo real</span>
      </div>
    </div>
  );
}

/**
 * Variante compacta do LeaderboardList para widgets/previews
 * Mostra apenas top 5 sem controles de paginação
 */
export function LeaderboardListCompact({
  entries,
  currentUserId,
  isLoading = false,
  className,
}: Omit<LeaderboardListProps, 'showLastActivity' | 'defaultLimit'>) {
  // Se estiver carregando, mostrar skeletons
  if (isLoading) {
    return (
      <Card padding="none" className={cn('overflow-hidden', className)}>
        <div className="divide-y divide-surface-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <LeaderboardEntrySkeleton key={index} />
          ))}
        </div>
      </Card>
    );
  }

  // Se não houver entradas, mostrar empty state
  if (entries.length === 0) {
    return (
      <Card className={cn('', className)}>
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm text-surface-500">
            Nenhum participante ainda
          </p>
        </div>
      </Card>
    );
  }

  // Mostrar apenas top 5
  const displayedEntries = entries.slice(0, 5);
  const hasMoreEntries = entries.length > 5;

  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className="divide-y divide-surface-100">
        {displayedEntries.map((entry, index) => (
          <LeaderboardEntry
            key={entry.user_id}
            entry={entry}
            position={index}
            currentUserId={currentUserId}
            showLastActivity={false}
          />
        ))}
      </div>

      {/* Indicador de mais entradas */}
      {hasMoreEntries && (
        <div className="bg-surface-50 px-3 py-2 text-center border-t border-surface-100">
          <p className="text-xs text-surface-600">
            +{entries.length - 5} participantes
          </p>
        </div>
      )}
    </Card>
  );
}

// Exportar variante compacta como propriedade do componente principal
LeaderboardList.Compact = LeaderboardListCompact;
