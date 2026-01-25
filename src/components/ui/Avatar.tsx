'use client';

import { useState } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  className?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
}

// Tamanhos do avatar em pixels
const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

// Classes de tamanho
const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

// Cores de fundo para fallback
const bgColors = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-teal-500',
  'bg-green-500',
  'bg-orange-500',
];

// Extrair iniciais do nome
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Obter cor baseada no nome
function getBgColor(name: string): string {
  const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return bgColors[sum % bgColors.length];
}

export function Avatar({ src, alt, name = '', size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showImage = src && !hasError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getBgColor(name) : 'bg-gray-400';
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ${sizeClass} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className={`flex items-center justify-center w-full h-full ${bgColor} text-white font-medium`}
          role="img"
          aria-label={alt || name || 'Avatar'}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
