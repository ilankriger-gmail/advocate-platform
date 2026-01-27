'use client';

import { useState, useTransition, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { likePost } from '@/actions/posts';
import { useHeartsToast } from '@/components/ui/HeartsToast';

interface LikeButtonProps {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
  size?: 'sm' | 'md';
}

export function LikeButton({
  postId,
  initialCount,
  initialLiked,
  size = 'md',
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(false);
  const { showHearts } = useHeartsToast();

  const handleClick = useCallback(() => {
    if (isPending) return;

    const newLiked = !liked;

    // Optimistic update
    setLiked(newLiked);
    setCount((prev) => (newLiked ? prev + 1 : prev - 1));

    if (newLiked) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    }

    startTransition(async () => {
      const result = await likePost(postId);
      if (!result.success) {
        // Revert on failure
        setLiked(!newLiked);
        setCount((prev) => (newLiked ? prev - 1 : prev + 1));
      } else if (newLiked && result.hearts) {
        showHearts(result.hearts, 'Te Amo!');
      }
    });
  }, [isPending, liked, postId, showHearts, startTransition]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        'flex items-center gap-1.5 transition-all duration-200 active:scale-90',
        liked
          ? 'text-red-500'
          : 'text-gray-500 hover:text-red-400',
        isPending && 'opacity-60',
      )}
      aria-label={liked ? 'Descurtir' : 'Curtir'}
    >
      <svg
        className={cn(
          iconSize,
          'transition-transform duration-300',
          animate && 'animate-like-pop',
        )}
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 && (
        <span
          className={cn(
            'font-semibold tabular-nums transition-colors duration-200',
            size === 'sm' ? 'text-xs' : 'text-sm',
            liked ? 'text-red-500' : 'text-gray-500',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
