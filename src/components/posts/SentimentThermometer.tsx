'use client';

import { useState, useTransition } from 'react';
import { votePost } from '@/actions/posts';
import { cn } from '@/lib/utils';

interface SentimentThermometerProps {
  postId: string;
  averageScore: number;      // Média dos votos (-5 a +5)
  totalVotes: number;        // Quantidade de votos
  userVote: number | null;   // Voto do usuário atual (-5 a +5)
  compact?: boolean;         // Versão compacta para feed
}

// Níveis do termômetro de +5 (topo) a -5 (base)
const LEVELS = [5, 4, 3, 2, 1, -1, -2, -3, -4, -5];

// Cores do gradiente: verde (positivo) -> amarelo (neutro) -> vermelho (negativo)
function getLevelColor(level: number): string {
  if (level >= 4) return 'bg-green-500 hover:bg-green-600';
  if (level >= 2) return 'bg-green-400 hover:bg-green-500';
  if (level >= 1) return 'bg-lime-400 hover:bg-lime-500';
  if (level >= -1) return 'bg-red-300 hover:bg-red-400';
  if (level >= -3) return 'bg-red-400 hover:bg-red-500';
  return 'bg-red-500 hover:bg-red-600';
}

// Emoji baseado na média
function getEmoji(score: number): string {
  if (score >= 3) return '😍';
  if (score >= 1) return '😊';
  if (score >= -1) return '😐';
  if (score >= -3) return '😕';
  return '😢';
}

// Cor do indicador baseado na média
function getAverageColor(score: number): string {
  if (score >= 2) return 'text-green-600';
  if (score >= 0) return 'text-lime-600';
  if (score >= -2) return 'text-yellow-600';
  return 'text-red-600';
}

export function SentimentThermometer({
  postId,
  averageScore,
  totalVotes,
  userVote,
  compact = false,
}: SentimentThermometerProps) {
  const [currentUserVote, setCurrentUserVote] = useState<number | null>(userVote);
  const [currentAverage, setCurrentAverage] = useState(averageScore);
  const [currentTotal, setCurrentTotal] = useState(totalVotes);
  const [isPending, startTransition] = useTransition();
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const handleVote = (level: number) => {
    // Se clicar no mesmo nível, remove o voto
    const newVote = currentUserVote === level ? null : level;

    // Otimistic update
    const oldVote = currentUserVote;
    const oldTotal = currentTotal;
    const oldAverage = currentAverage;

    // Calcula nova média otimisticamente
    let newTotal = oldTotal;
    let totalScore = oldAverage * oldTotal;

    if (oldVote !== null) {
      // Remove voto antigo
      totalScore -= oldVote;
      newTotal--;
    }

    if (newVote !== null) {
      // Adiciona novo voto
      totalScore += newVote;
      newTotal++;
    }

    setCurrentUserVote(newVote);
    setCurrentTotal(newTotal);
    setCurrentAverage(newTotal > 0 ? totalScore / newTotal : 0);

    startTransition(async () => {
      const result = await votePost(postId, newVote === null ? 0 : newVote);
      if (result.success && result.data) {
        setCurrentAverage(result.data.averageScore);
        setCurrentTotal(result.data.totalVotes);
        setCurrentUserVote(result.data.userVote);
      } else {
        // Rollback se falhar
        setCurrentUserVote(oldVote);
        setCurrentTotal(oldTotal);
        setCurrentAverage(oldAverage);
      }
    });
  };

  // Versão compacta - apenas emoji e score
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-lg">{getEmoji(currentAverage)}</span>
        <span className={cn('text-sm font-medium', getAverageColor(currentAverage))}>
          {currentAverage > 0 ? '+' : ''}{currentAverage.toFixed(1)}
        </span>
        {currentTotal > 0 && (
          <span className="text-xs text-gray-400">({currentTotal})</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Emoji e média no topo */}
      <div className="flex items-center gap-1 mb-1">
        <span className="text-xl">{getEmoji(currentAverage)}</span>
        <span className={cn('text-sm font-bold', getAverageColor(currentAverage))}>
          {currentAverage > 0 ? '+' : ''}{currentAverage.toFixed(1)}
        </span>
      </div>

      {/* Barra do termômetro */}
      <div className="relative flex flex-col gap-0.5">
        {LEVELS.map((level) => {
          const isUserVote = currentUserVote === level;
          const isHovered = hoveredLevel === level;

          return (
            <button
              key={level}
              onClick={() => handleVote(level)}
              onMouseEnter={() => setHoveredLevel(level)}
              onMouseLeave={() => setHoveredLevel(null)}
              disabled={isPending}
              className={cn(
                'w-8 h-2.5 rounded-sm transition-all duration-150',
                getLevelColor(level),
                isUserVote && 'ring-2 ring-offset-1 ring-gray-800 scale-110',
                isHovered && !isUserVote && 'scale-105 opacity-80',
                isPending && 'opacity-50 cursor-wait'
              )}
              title={`${level > 0 ? '+' : ''}${level}`}
            />
          );
        })}

        {/* Indicador de posição da média */}
        {currentTotal > 0 && (
          <div
            className="absolute -right-2 w-1.5 h-1.5 bg-gray-800 rounded-full transition-all duration-300"
            style={{
              top: `${((5 - currentAverage) / 10) * 100}%`,
              transform: 'translateY(-50%)'
            }}
          />
        )}
      </div>

      {/* Total de votos */}
      {currentTotal > 0 && (
        <span className="text-[10px] text-gray-400 mt-1">
          {currentTotal} {currentTotal === 1 ? 'voto' : 'votos'}
        </span>
      )}

      {/* Tooltip ao hover */}
      {hoveredLevel !== null && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
          {hoveredLevel > 0 ? '+' : ''}{hoveredLevel}
        </div>
      )}
    </div>
  );
}
