'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui';

interface RankingEntry {
  position: number;
  userId: string;
  fullName: string;
  username: string | null;
  avatarUrl: string | null;
  balance: number;
  isCurrentUser: boolean;
  previousPosition?: number | null;
}

interface RankingListProps {
  ranking: RankingEntry[];
  userPosition: number | null;
  userBalance: number;
  totalUsers: number;
}

export function RankingList({ ranking, userPosition, userBalance, totalUsers }: RankingListProps) {
  const [visibleCount, setVisibleCount] = useState(30);
  const userRowRef = useRef<HTMLDivElement>(null);

  // Separar top 3 e o resto
  const top3 = ranking.slice(0, 3);
  const restRanking = ranking.slice(3, visibleCount);

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 30, ranking.length));
  };

  if (!ranking || ranking.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ranking em construção
        </h3>
        <p className="text-gray-500">
          Complete desafios e interaja para aparecer no ranking!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== PÓDIO TOP 3 ===== */}
      {top3.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-200/50 p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="text-3xl">🏆</span>
            <h2 className="text-lg font-bold text-gray-900 mt-1">Top da Comunidade</h2>
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6">
            {/* 2º lugar */}
            {top3[1] && (
              <PodiumCard entry={top3[1]} medal="🥈" size="second" />
            )}
            
            {/* 1º lugar (mais alto) */}
            {top3[0] && (
              <PodiumCard entry={top3[0]} medal="🥇" size="first" />
            )}
            
            {/* 3º lugar */}
            {top3[2] && (
              <PodiumCard entry={top3[2]} medal="🥉" size="third" />
            )}
          </div>
        </div>
      )}

      {/* ===== SUA POSIÇÃO ===== */}
      {userPosition && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[2px]">
          <div className="relative bg-white rounded-[14px] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                  <span className="text-xl font-bold text-purple-700">#{userPosition}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sua posição</p>
                  <p className="text-lg font-bold text-gray-900">
                    de {totalUsers} participantes
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Seus corações</p>
                <div className="flex items-center gap-1.5 text-2xl font-bold text-pink-600">
                  <span>❤️</span>
                  <span>{userBalance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RANKING COMPLETO ===== */}
      {restRanking.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Ranking Completo
            </h3>
          </div>

          {restRanking.map((entry) => (
            <div
              key={entry.userId}
              ref={entry.isCurrentUser ? userRowRef : null}
              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b border-gray-100 last:border-b-0 transition ${
                entry.isCurrentUser 
                  ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500' 
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Posição */}
              <div className="w-10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-gray-500">
                  {entry.position}º
                </span>
              </div>

              {/* Avatar + Nome */}
              <Link 
                href={`/profile/${entry.userId}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar
                  name={entry.fullName}
                  src={entry.avatarUrl || undefined}
                  size="md"
                />
                <div className="min-w-0">
                  <p className={`font-medium truncate ${
                    entry.isCurrentUser ? 'text-purple-700' : 'text-gray-900'
                  }`}>
                    {entry.fullName}
                    {entry.isCurrentUser && (
                      <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        Você
                      </span>
                    )}
                  </p>
                  {entry.username && (
                    <p className="text-sm text-gray-500 truncate">@{entry.username}</p>
                  )}
                </div>
              </Link>

              {/* Movimento */}
              <MovementIndicator current={entry.position} previous={entry.previousPosition} />

              {/* Corações */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm">❤️</span>
                <span className="text-sm font-bold text-pink-600">{entry.balance}</span>
              </div>
            </div>
          ))}

          {/* Carregar mais */}
          {visibleCount < ranking.length && (
            <button
              onClick={loadMore}
              className="w-full p-4 text-center text-purple-600 hover:bg-purple-50 font-medium transition"
            >
              Ver mais ({ranking.length - visibleCount} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ===== COMPONENTES AUXILIARES ===== */

function PodiumCard({ entry, medal, size }: { 
  entry: RankingEntry; 
  medal: string; 
  size: 'first' | 'second' | 'third';
}) {
  const avatarSizes = {
    first: 'w-20 h-20 sm:w-24 sm:h-24',
    second: 'w-16 h-16 sm:w-20 sm:h-20',
    third: 'w-16 h-16 sm:w-20 sm:h-20',
  };

  const containerHeight = {
    first: 'pb-4',
    second: 'pb-0',
    third: 'pb-0',
  };

  return (
    <Link 
      href={`/profile/${entry.userId}`}
      className={`flex flex-col items-center text-center w-28 sm:w-32 ${containerHeight[size]}`}
    >
      {/* Medal */}
      <span className={`${size === 'first' ? 'text-4xl' : 'text-3xl'} mb-2`}>
        {medal}
      </span>

      {/* Avatar */}
      <div className={`relative ${avatarSizes[size]} rounded-full overflow-hidden mb-2 ring-2 ${
        size === 'first' ? 'ring-yellow-400 ring-offset-2' : 
        size === 'second' ? 'ring-gray-300 ring-offset-1' : 
        'ring-amber-600 ring-offset-1'
      }`}>
        {entry.avatarUrl ? (
          <img
            src={entry.avatarUrl}
            alt={entry.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg sm:text-xl">
            {getInitials(entry.fullName)}
          </div>
        )}
      </div>

      {/* Nome */}
      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate w-full">
        {entry.fullName}
      </p>

      {/* Username */}
      {entry.username && (
        <p className="text-xs text-gray-500 truncate w-full">@{entry.username}</p>
      )}

      {/* Corações */}
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs">❤️</span>
        <span className="text-sm font-bold text-pink-600">{entry.balance}</span>
      </div>
    </Link>
  );
}

function MovementIndicator({ current, previous }: { current: number; previous?: number | null }) {
  if (!previous || previous === current) return null;
  
  const diff = previous - current;
  
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-green-500 text-xs font-medium shrink-0">
        <span>▲</span><span>{diff}</span>
      </span>
    );
  }
  
  return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium shrink-0">
      <span>▼</span><span>{Math.abs(diff)}</span>
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
