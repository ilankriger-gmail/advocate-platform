'use client';

import Image from 'next/image';
import { useState } from 'react';

interface StoryAvatarProps {
  src?: string | null;
  name: string;
  hasUnviewed: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  isAddButton?: boolean;
}

const sizeStyles = {
  sm: {
    outer: 'w-14 h-14',
    inner: 'w-12 h-12',
    ring: 'p-[2px]',
    text: 'text-xs',
    plus: 'text-lg',
  },
  md: {
    outer: 'w-16 h-16',
    inner: 'w-14 h-14',
    ring: 'p-[2px]',
    text: 'text-xs',
    plus: 'text-xl',
  },
  lg: {
    outer: 'w-20 h-20',
    inner: 'w-[72px] h-[72px]',
    ring: 'p-[3px]',
    text: 'text-sm',
    plus: 'text-2xl',
  },
};

// Cores de fundo para fallback baseadas no nome
const backgroundColors = [
  'bg-primary-500',
  'bg-accent-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-indigo-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getBackgroundColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return backgroundColors[index % backgroundColors.length];
}

export function StoryAvatar({
  src,
  name,
  hasUnviewed,
  size = 'md',
  onClick,
  isAddButton = false,
}: StoryAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const styles = sizeStyles[size];
  const showFallback = !src || imageError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getBackgroundColor(name) : 'bg-surface-400';

  // Gradiente do Instagram para stories não vistos
  const ringGradient = hasUnviewed
    ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
    : 'bg-surface-300';

  if (isAddButton) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-1 group"
      >
        <div className={`${styles.outer} flex items-center justify-center`}>
          <div className="w-full h-full rounded-full bg-surface-100 border-2 border-dashed border-surface-300 flex items-center justify-center group-hover:border-primary-500 group-hover:bg-primary-50 transition-colors">
            <span className={`${styles.plus} text-surface-400 group-hover:text-primary-500`}>
              +
            </span>
          </div>
        </div>
        <span className={`${styles.text} text-surface-600 truncate max-w-[60px]`}>
          Criar
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      {/* Anel com gradiente */}
      <div className={`${styles.outer} flex items-center justify-center`}>
        <div className={`w-full h-full rounded-full ${ringGradient} ${styles.ring} flex items-center justify-center`}>
          {/* Avatar interno */}
          <div className={`${styles.inner} rounded-full bg-white overflow-hidden flex items-center justify-center`}>
            {showFallback ? (
              <div
                className={`w-full h-full flex items-center justify-center ${bgColor} text-white font-medium text-sm`}
              >
                {initials}
              </div>
            ) : (
              <Image
                src={src!}
                alt={name}
                fill
                sizes="80px"
                onError={() => setImageError(true)}
                className="object-cover"
              />
            )}
          </div>
        </div>
      </div>
      {/* Nome */}
      <span className={`${styles.text} text-surface-600 truncate max-w-[60px]`}>
        {name.split(' ')[0]}
      </span>
    </button>
  );
}
