'use client';

import { useState, useTransition } from 'react';
import { votePost } from '@/actions/posts';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  postId: string;
  initialScore: number;
  initialUserVote: number | null;
  vertical?: boolean;
}

export function VoteButtons({
  postId,
  initialScore,
  initialUserVote,
  vertical = true,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [isPending, startTransition] = useTransition();

  const handleVote = (voteType: 1 | -1) => {
    // Otimistic update
    const newVote = userVote === voteType ? null : voteType;
    const scoreDiff = newVote === null
      ? -voteType // Removendo voto
      : userVote === null
        ? voteType // Novo voto
        : voteType * 2; // Mudando de up para down ou vice-versa

    setUserVote(newVote);
    setScore((prev) => prev + scoreDiff);

    startTransition(async () => {
      const result = await votePost(postId, newVote === null ? 0 : voteType);
      if (result.success && result.data) {
        setScore(result.data.voteScore);
        setUserVote(result.data.userVote);
      }
    });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        vertical ? 'flex-col' : 'flex-row'
      )}
    >
      {/* Upvote */}
      <button
        onClick={() => handleVote(1)}
        disabled={isPending}
        className={cn(
          'p-1.5 rounded-lg transition-all hover:bg-primary-50 press-scale',
          userVote === 1
            ? 'text-primary-600 bg-primary-50'
            : 'text-surface-400 hover:text-primary-600'
        )}
        title="Upvote"
      >
        <svg
          className="w-5 h-5"
          fill={userVote === 1 ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {/* Score */}
      <span
        className={cn(
          'text-sm font-semibold min-w-[2rem] text-center',
          userVote === 1 && 'text-primary-600',
          userVote === -1 && 'text-accent-600',
          !userVote && 'text-surface-600'
        )}
      >
        {score}
      </span>

      {/* Downvote */}
      <button
        onClick={() => handleVote(-1)}
        disabled={isPending}
        className={cn(
          'p-1.5 rounded-lg transition-all hover:bg-accent-50 press-scale',
          userVote === -1
            ? 'text-accent-600 bg-accent-50'
            : 'text-surface-400 hover:text-accent-600'
        )}
        title="Downvote"
      >
        <svg
          className="w-5 h-5"
          fill={userVote === -1 ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  );
}
