'use client';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { TierBadge } from './TierBadge';
import { LeaderboardEntry as LeaderboardEntryType } from '@/lib/supabase/types';

/**
 * Componente para exibir uma entrada individual do leaderboard
 * Mostra rank, avatar, nome, pontuação e tier badge
 */

interface LeaderboardEntryProps {
  entry: LeaderboardEntryType;
  position: number; // Posição no ranking (0-indexed)
  currentUserId?: string | null; // ID do usuário atual para highlight
  showLastActivity?: boolean; // Mostrar última atividade
  className?: string;
}

/**
 * Função para obter medalha emoji ou número da posição
 */
function getRankDisplay(position: number): string {
  switch (position) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return `${position + 1}º`;
  }
}

/**
 * Função para formatar pontuação com separadores de milhar
 */
function formatScore(score: number): string {
  return score.toLocaleString('pt-BR');
}

/**
 * Função para formatar data de última atividade
 */
function formatLastActivity(date: string | null): string {
  if (!date) return 'Sem atividade';

  const activityDate = new Date(date);
  const now = new Date();
  const diffInMs = now.getTime() - activityDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return 'Hoje';
  } else if (diffInDays === 1) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    return `${diffInDays}d atrás`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks}sem atrás`;
  } else {
    return activityDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
}

export function LeaderboardEntry({
  entry,
  position,
  currentUserId,
  showLastActivity = false,
  className,
}: LeaderboardEntryProps) {
  const isCurrentUser = currentUserId && entry.user_id === currentUserId;
  const isTopThree = position < 3;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 transition-colors',
        isCurrentUser && 'bg-primary-50 border-l-4 border-primary-500',
        !isCurrentUser && 'hover:bg-surface-50',
        className
      )}
    >
      {/* Lado esquerdo: Rank + Avatar + Nome */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Rank */}
        <div
          className={cn(
            'w-10 text-center font-bold shrink-0',
            isTopThree ? 'text-2xl' : 'text-lg text-surface-600'
          )}
        >
          {getRankDisplay(position)}
        </div>

        {/* Avatar */}
        <Avatar
          src={entry.avatar_url}
          name={entry.full_name || 'Usuário'}
          size="md"
          className="shrink-0"
        />

        {/* Informações do usuário */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'font-semibold text-surface-900 truncate',
                isCurrentUser && 'text-primary-700'
              )}
            >
              {entry.full_name || 'Usuário Anônimo'}
            </p>
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full shrink-0">
                Você
              </span>
            )}
          </div>
          {showLastActivity && entry.last_activity && (
            <p className="text-xs text-surface-500 mt-0.5">
              Última atividade: {formatLastActivity(entry.last_activity)}
            </p>
          )}
        </div>
      </div>

      {/* Lado direito: Pontuação + Tier */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Pontuação */}
        <div className="text-right">
          <p
            className={cn(
              'font-bold text-lg',
              isCurrentUser ? 'text-primary-600' : 'text-surface-900',
              isTopThree && !isCurrentUser && 'text-amber-600'
            )}
          >
            {formatScore(entry.score)}
          </p>
          <p className="text-xs text-surface-500">pontos</p>
        </div>

        {/* Tier Badge */}
        <TierBadge tier={entry.tier} size="md" showLabel={false} />
      </div>
    </div>
  );
}

/**
 * Variante compacta do LeaderboardEntry para preview/widgets
 */
export function LeaderboardEntryCompact({
  entry,
  position,
  currentUserId,
  className,
}: Omit<LeaderboardEntryProps, 'showLastActivity'>) {
  const isCurrentUser = currentUserId && entry.user_id === currentUserId;
  const isTopThree = position < 3;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 transition-colors',
        isCurrentUser && 'bg-primary-50',
        !isCurrentUser && 'hover:bg-surface-50',
        className
      )}
    >
      {/* Lado esquerdo: Rank + Avatar + Nome */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Rank */}
        <span
          className={cn(
            'w-6 text-center font-bold shrink-0',
            isTopThree ? 'text-lg' : 'text-sm text-surface-600'
          )}
        >
          {getRankDisplay(position)}
        </span>

        {/* Avatar */}
        <Avatar
          src={entry.avatar_url}
          name={entry.full_name || 'Usuário'}
          size="sm"
          className="shrink-0"
        />

        {/* Nome */}
        <p
          className={cn(
            'text-sm font-medium text-surface-900 truncate',
            isCurrentUser && 'text-primary-700'
          )}
        >
          {entry.full_name || 'Usuário Anônimo'}
        </p>
      </div>

      {/* Lado direito: Pontuação + Tier */}
      <div className="flex items-center gap-2 shrink-0">
        <p
          className={cn(
            'text-sm font-bold',
            isCurrentUser ? 'text-primary-600' : 'text-surface-700'
          )}
        >
          {formatScore(entry.score)}
        </p>
        <TierBadge tier={entry.tier} size="sm" showLabel={false} />
      </div>
    </div>
  );
}

// Exportar variante compacta como propriedade do componente principal
LeaderboardEntry.Compact = LeaderboardEntryCompact;
