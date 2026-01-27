'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';

interface RankingEntryWithPosition {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  balance: number;
  position: number;
}

type ViewMode = 'top' | 'me';

interface LeaderboardWidgetClientProps {
  entries: RankingEntryWithPosition[];
  userId: string | null;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
      {rank}
    </span>
  );
}

function getName(entry: RankingEntryWithPosition) {
  return entry.full_name || (entry.email ? entry.email.split('@')[0] : 'Usuário');
}

export function LeaderboardWidgetClient({ entries, userId }: LeaderboardWidgetClientProps) {
  // Find user position
  const userEntry = userId ? entries.find((e) => e.user_id === userId) : null;
  const userPosition = userEntry?.position ?? null;
  const isInTop3 = userPosition !== null && userPosition <= 3;

  // Default to "me" if user has a position, otherwise "top"
  const [view, setView] = useState<ViewMode>(userPosition ? 'me' : 'top');

  const top3 = entries.slice(0, 3);

  // Nearby users around user's position
  const nearbyUsers: RankingEntryWithPosition[] = [];
  if (userPosition && userPosition > 3) {
    const start = Math.max(0, userPosition - 2);
    const end = Math.min(entries.length, userPosition + 1);
    for (let i = start; i < end; i++) {
      nearbyUsers.push(entries[i]);
    }
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Top Embaixadores
          </h3>
          <Link href="/ranking" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            Ver ranking
          </Link>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum embaixador ainda. Seja o primeiro! 💪
        </p>
      </Card>
    );
  }

  const renderEntry = (entry: RankingEntryWithPosition) => {
    const isCurrentUser = entry.user_id === userId;
    return (
      <Link
        key={entry.user_id}
        href={`/profile/${entry.user_id}`}
        className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
          isCurrentUser
            ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200'
            : 'hover:bg-gray-50'
        }`}
      >
        <RankBadge rank={entry.position} />
        <Avatar
          name={getName(entry)}
          src={entry.avatar_url || undefined}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className={`font-medium truncate text-sm ${
            isCurrentUser ? 'text-purple-700' : 'text-gray-900'
          }`}>
            {getName(entry)}
            {isCurrentUser && (
              <span className="ml-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                você
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-semibold text-pink-600">
          <span>❤️</span>
          {entry.balance}
        </div>
      </Link>
    );
  };

  // What to show in "me" view
  const showMeView = view === 'me' && userPosition;

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          Top Embaixadores
        </h3>
        <Link href="/ranking" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
          Ver ranking
        </Link>
      </div>

      {/* Toggle selector */}
      {userPosition && !isInTop3 && (
        <div className="flex items-center bg-gray-100 rounded-lg p-1 mb-3">
          <button
            type="button"
            onClick={() => setView('top')}
            className={`flex-1 text-center text-sm font-medium py-1.5 rounded-md transition-all ${
              view === 'top'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🏆 Top 3
          </button>
          <button
            type="button"
            onClick={() => setView('me')}
            className={`flex-1 text-center text-sm font-medium py-1.5 rounded-md transition-all ${
              view === 'me'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📍 Sua Posição
          </button>
        </div>
      )}

      {/* Content */}
      {showMeView && !isInTop3 ? (
        /* "Sua Posição" view — show nearby users */
        <div className="space-y-2">
          {nearbyUsers.map(renderEntry)}
        </div>
      ) : (
        /* "Top 3" view (or user is in top 3) */
        <>
          <div className="space-y-2">
            {top3.map(renderEntry)}
          </div>

          {/* User position below if in top view and not in top 3 */}
          {view === 'top' && !isInTop3 && userPosition && nearbyUsers.length > 0 && (
            <>
              <div className="my-3 flex items-center gap-2">
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <span className="text-xs text-gray-400">sua posição</span>
                <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>
              <div className="space-y-2">
                {nearbyUsers.map(renderEntry)}
              </div>
            </>
          )}
        </>
      )}

      {/* Not ranked */}
      {!userPosition && userId && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Complete desafios para aparecer no ranking! 💪
          </p>
        </div>
      )}
    </Card>
  );
}
