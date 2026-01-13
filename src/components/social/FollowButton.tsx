'use client';

import { useState, useTransition } from 'react';
import { toggleFollow } from '@/actions/social';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing,
  variant = 'default',
  className = '',
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = () => {
    // Optimistic update
    const newState = !isFollowing;
    setIsFollowing(newState);

    startTransition(async () => {
      const result = await toggleFollow(userId);

      if (!result.success) {
        // Reverter em caso de erro
        setIsFollowing(!newState);
        console.error(result.error);
        return;
      }

      onFollowChange?.(result.isFollowing);
    });
  };

  // Texto do botão baseado no estado
  const getButtonText = () => {
    if (isPending) return 'Aguarde...';
    if (isFollowing) {
      return isHovering ? 'Deixar de seguir' : 'Seguindo';
    }
    return 'Seguir';
  };

  // Classes do botão baseadas no estado
  const getButtonClasses = () => {
    const base = variant === 'compact'
      ? 'px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200'
      : 'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200';

    if (isPending) {
      return `${base} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    if (isFollowing) {
      if (isHovering) {
        return `${base} bg-red-50 text-red-600 border border-red-200 hover:bg-red-100`;
      }
      return `${base} bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200`;
    }

    return `${base} bg-indigo-600 text-white hover:bg-indigo-700`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`${getButtonClasses()} ${className}`}
    >
      {getButtonText()}
    </button>
  );
}
