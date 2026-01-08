'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeaderboardEntry } from './LeaderboardEntry';
import { UserRankCard } from './UserRankCard';
import { fetchCombinedLeaderboard, fetchUserRank } from '@/actions/leaderboard';
import type {
  LeaderboardEntry as LeaderboardEntryType,
  UserRanking,
} from '@/lib/supabase/types';

/**
 * Widget de preview do leaderboard para dashboard
 * Mostra top 5 usuários e link para página completa
 * Exibe ranking do usuário se não estiver no top 5
 */

interface LeaderboardPreviewProps {
  currentUserId?: string | null;
  className?: string;
}

/**
 * Skeleton para loading state
 */
function LeaderboardPreviewSkeleton() {
  return (
    <div className="space-y-3">
      <div className="animate-pulse">
        <div className="h-5 bg-surface-200 rounded w-32 mb-2" />
        <div className="h-4 bg-surface-200 rounded w-48" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-6 h-6 bg-surface-200 rounded shrink-0" />
            <div className="w-8 h-8 bg-surface-200 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 bg-surface-200 rounded w-24" />
            </div>
            <div className="w-12 h-4 bg-surface-200 rounded" />
            <div className="w-12 h-6 bg-surface-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Estado vazio
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="text-5xl mb-3">🏆</div>
      <h3 className="text-base font-semibold text-surface-900 mb-2">
        Nenhum participante ainda
      </h3>
      <p className="text-sm text-surface-500 max-w-sm">
        Seja o primeiro a participar e aparecer no ranking!
      </p>
    </div>
  );
}

export function LeaderboardPreview({
  currentUserId,
  className,
}: LeaderboardPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntryType[]>([]);
  const [userRank, setUserRank] = useState<UserRanking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do leaderboard (top 5) e ranking do usuário
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Buscar top 5 do ranking combinado (all-time)
        const leaderboardResult = await fetchCombinedLeaderboard('all_time', 5);

        if (leaderboardResult.error) {
          setError(leaderboardResult.error);
          setEntries([]);
        } else {
          setEntries(leaderboardResult.data || []);
        }

        // Buscar ranking do usuário (se autenticado)
        if (currentUserId) {
          const userRankResult = await fetchUserRank('combined', 'all_time');

          if (!userRankResult.error && userRankResult.data) {
            setUserRank(userRankResult.data);
          }
        }
      } catch (err) {
        console.error('Error loading leaderboard preview:', err);
        setError('Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUserId]);

  // Verificar se o usuário está no top 5
  const isUserInTop5 = userRank && userRank.rank <= 5;

  return (
    <Card className={cn('', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Top Rankings
            </h3>
            <p className="text-sm text-surface-500 mt-0.5">
              Os melhores da comunidade
            </p>
          </div>
          <Link href="/ranking">
            <Button size="sm" variant="ghost" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
              Ver tudo
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </Link>
        </div>

        {/* Loading state */}
        {loading && <LeaderboardPreviewSkeleton />}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && entries.length === 0 && <EmptyState />}

        {/* Lista de top 5 */}
        {!loading && !error && entries.length > 0 && (
          <>
            <Card padding="none" className="overflow-hidden border border-surface-100">
              <div className="divide-y divide-surface-100">
                {entries.map((entry, index) => (
                  <LeaderboardEntry.Compact
                    key={entry.user_id}
                    entry={entry}
                    position={index}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </Card>

            {/* Ranking do usuário se não estiver no top 5 */}
            {userRank && !isUserInTop5 && (
              <div className="pt-2">
                <p className="text-xs font-medium text-surface-600 mb-2 uppercase tracking-wide">
                  Sua posição
                </p>
                <UserRankCard.Compact
                  ranking={userRank}
                  userName={null}
                  userAvatar={null}
                />
              </div>
            )}

            {/* Link para página completa */}
            <div className="pt-2">
              <Link href="/ranking">
                <Button
                  variant="outline"
                  className="w-full text-primary-600 border-primary-200 hover:bg-primary-50 hover:border-primary-300"
                >
                  <span className="flex items-center justify-center gap-2">
                    Ver ranking completo
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
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </Button>
              </Link>
            </div>

            {/* Info sobre atualização */}
            <div className="flex items-center justify-center gap-2 text-xs text-surface-500 pt-1">
              <svg
                className="w-3.5 h-3.5"
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
              <span>Atualizado em tempo real</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
