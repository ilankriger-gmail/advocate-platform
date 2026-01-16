'use client';

import { useState, useTransition } from 'react';
import { votePost } from '@/actions/posts';
import { cn } from '@/lib/utils';

interface SentimentThermometerProps {
  postId: string;
  averageScore: number;      // Média dos votos (-2 a +2)
  totalVotes: number;        // Quantidade de votos
  userVote: number | null;   // Voto do usuário atual (-2 a +2)
  compact?: boolean;         // Versão compacta para feed
}

// 5 níveis de reação com emojis
const REACTIONS = [
  { value: -2, emoji: '😢', label: 'Não gostei', color: 'hover:bg-red-100' },
  { value: -1, emoji: '😕', label: 'Mais ou menos', color: 'hover:bg-orange-100' },
  { value: 0, emoji: '😐', label: 'Neutro', color: 'hover:bg-gray-100' },
  { value: 1, emoji: '😊', label: 'Gostei', color: 'hover:bg-green-100' },
  { value: 2, emoji: '😍', label: 'Amei!', color: 'hover:bg-pink-100' },
];

// Emoji baseado na média
function getEmoji(score: number): string {
  if (score >= 1.5) return '😍';
  if (score >= 0.5) return '😊';
  if (score >= -0.5) return '😐';
  if (score >= -1.5) return '😕';
  return '😢';
}

// Cor de fundo baseada na média
function getAverageBackground(score: number): string {
  if (score >= 1.5) return 'bg-pink-50';
  if (score >= 0.5) return 'bg-green-50';
  if (score >= -0.5) return 'bg-gray-50';
  if (score >= -1.5) return 'bg-orange-50';
  return 'bg-red-50';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleVote = (value: number) => {
    // Se clicar no mesmo, remove o voto
    const newVote = currentUserVote === value ? null : value;

    // Otimistic update
    const oldVote = currentUserVote;
    const oldTotal = currentTotal;
    const oldAverage = currentAverage;

    // Calcula nova média otimisticamente
    let newTotal = oldTotal;
    let totalScore = oldAverage * oldTotal;

    if (oldVote !== null) {
      totalScore -= oldVote;
      newTotal--;
    }

    if (newVote !== null) {
      totalScore += newVote;
      newTotal++;
    }

    setCurrentUserVote(newVote);
    setCurrentTotal(newTotal);
    setCurrentAverage(newTotal > 0 ? totalScore / newTotal : 0);

    // Fechar painel após votar
    if (compact && newVote !== null) {
      setTimeout(() => setIsExpanded(false), 500);
    }

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

  const userReaction = REACTIONS.find(r => r.value === currentUserVote);

  // Versão compacta para feed
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Resultado atual */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full transition-all',
            getAverageBackground(currentAverage),
            'hover:scale-105'
          )}
        >
          <span className="text-base">{getEmoji(currentAverage)}</span>
          {currentTotal > 0 && (
            <span className="text-xs text-gray-600 font-medium">
              {currentTotal}
            </span>
          )}
        </button>

        {/* Painel expansível */}
        {isExpanded && (
          <div className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
            {REACTIONS.map((reaction) => {
              const isSelected = currentUserVote === reaction.value;
              return (
                <button
                  key={reaction.value}
                  onClick={() => handleVote(reaction.value)}
                  disabled={isPending}
                  title={reaction.label}
                  className={cn(
                    'p-1 rounded-full transition-all duration-200',
                    reaction.color,
                    isSelected && 'scale-125 ring-2 ring-offset-1 ring-gray-400',
                    isPending && 'opacity-50 cursor-wait'
                  )}
                >
                  <span className={cn('text-lg', isSelected && 'animate-bounce')}>{reaction.emoji}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Indicador de voto do usuário */}
        {!isExpanded && userReaction && (
          <span className="text-xs text-gray-500">
            Você: {userReaction.emoji}
          </span>
        )}
      </div>
    );
  }

  // Versão completa
  return (
    <div className="flex flex-col gap-3">
      {/* Emojis de reação */}
      <div className="flex items-center justify-center gap-2">
        {REACTIONS.map((reaction) => {
          const isSelected = currentUserVote === reaction.value;
          return (
            <button
              key={reaction.value}
              onClick={() => handleVote(reaction.value)}
              disabled={isPending}
              title={reaction.label}
              className={cn(
                'p-2 rounded-xl transition-all duration-200',
                reaction.color,
                isSelected && 'scale-125 ring-2 ring-offset-2 ring-gray-400 bg-white shadow-md',
                !isSelected && 'hover:scale-110',
                isPending && 'opacity-50 cursor-wait'
              )}
            >
              <span className={cn(
                'text-2xl block transition-transform',
                isSelected && 'animate-bounce'
              )}>
                {reaction.emoji}
              </span>
            </button>
          );
        })}
      </div>

      {/* Resultado da comunidade */}
      <div className={cn(
        'flex items-center justify-center gap-2 px-3 py-2 rounded-full mx-auto',
        getAverageBackground(currentAverage)
      )}>
        <span className="text-lg">{getEmoji(currentAverage)}</span>
        <span className="text-sm text-gray-700">
          {currentAverage >= 0 ? '+' : ''}{currentAverage.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          · {currentTotal} {currentTotal === 1 ? 'voto' : 'votos'}
        </span>
      </div>

      {/* Feedback do voto do usuário */}
      {userReaction && (
        <p className="text-center text-xs text-gray-500">
          Você votou: <span className="font-medium">{userReaction.emoji} {userReaction.label}</span>
        </p>
      )}
    </div>
  );
}
