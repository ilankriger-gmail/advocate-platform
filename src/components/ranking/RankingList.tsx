'use client';

import { useState, useEffect, useRef } from 'react';
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
}

interface RankingListProps {
  ranking: RankingEntry[];
  userPosition: number | null;
  totalUsers: number;
}

type ViewMode = 'relative' | 'full';

export function RankingList({ ranking, userPosition, totalUsers }: RankingListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('relative');
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const userRowRef = useRef<HTMLDivElement>(null);

  // Calcular o range relativo (5 acima e 5 abaixo do usuário)
  const getRelativeRange = () => {
    if (!userPosition) return { start: 0, end: 10 };
    const start = Math.max(0, userPosition - 6); // 5 acima
    const end = Math.min(ranking.length, userPosition + 5); // 5 abaixo
    return { start, end };
  };

  const relativeRange = getRelativeRange();
  
  // Entries a mostrar baseado no modo
  const displayEntries = viewMode === 'relative' 
    ? ranking.slice(relativeRange.start, relativeRange.end)
    : ranking.slice(visibleRange.start, visibleRange.end);

  // Scroll para a posição do usuário quando mudar para modo completo
  useEffect(() => {
    if (viewMode === 'full' && userRowRef.current) {
      setTimeout(() => {
        userRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [viewMode]);

  // Carregar mais ao rolar
  const loadMore = () => {
    if (visibleRange.end < ranking.length) {
      setVisibleRange(prev => ({
        ...prev,
        end: Math.min(prev.end + 20, ranking.length)
      }));
    }
  };

  // Badge de posição
  const PositionBadge = ({ position }: { position: number }) => {
    if (position === 1) return <span className="text-2xl">🥇</span>;
    if (position === 2) return <span className="text-2xl">🥈</span>;
    if (position === 3) return <span className="text-2xl">🥉</span>;
    
    return (
      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
        {position}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toggle de visualização */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('relative')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'relative'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📍 Minha posição
          </button>
          <button
            onClick={() => {
              setViewMode('full');
              setVisibleRange({ start: 0, end: Math.max(20, (userPosition || 0) + 10) });
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'full'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📊 Ranking completo
          </button>
        </div>
        <span className="text-sm text-gray-500">
          {totalUsers} participantes
        </span>
      </div>

      {/* Legenda no modo relativo */}
      {viewMode === 'relative' && userPosition && (
        <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-lg py-2">
          Mostrando posições próximas à sua (#{userPosition})
        </div>
      )}

      {/* Lista de ranking */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {displayEntries.map((entry) => (
          <div
            key={entry.userId}
            ref={entry.isCurrentUser ? userRowRef : null}
            className={`flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 transition ${
              entry.isCurrentUser 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500' 
                : 'hover:bg-gray-50'
            }`}
          >
            {/* Posição */}
            <div className="w-12 flex justify-center">
              <PositionBadge position={entry.position} />
            </div>

            {/* Avatar e nome */}
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

            {/* Corações */}
            <div className="flex items-center gap-2 text-lg font-bold text-pink-600">
              <span>❤️</span>
              <span>{entry.balance}</span>
            </div>
          </div>
        ))}

        {/* Botão carregar mais no modo completo */}
        {viewMode === 'full' && visibleRange.end < ranking.length && (
          <button
            onClick={loadMore}
            className="w-full p-4 text-center text-purple-600 hover:bg-purple-50 font-medium transition"
          >
            Carregar mais ({ranking.length - visibleRange.end} restantes)
          </button>
        )}
      </div>

      {/* Separador visual entre blocos no modo relativo */}
      {viewMode === 'relative' && relativeRange.start > 0 && (
        <div className="text-center">
          <button
            onClick={() => setViewMode('full')}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            ↑ Ver {relativeRange.start} posições acima
          </button>
        </div>
      )}

      {viewMode === 'relative' && relativeRange.end < ranking.length && (
        <div className="text-center">
          <button
            onClick={() => setViewMode('full')}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            ↓ Ver {ranking.length - relativeRange.end} posições abaixo
          </button>
        </div>
      )}
    </div>
  );
}
