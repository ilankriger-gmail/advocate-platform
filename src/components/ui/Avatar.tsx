'use client';

import { useState, type ImgHTMLAttributes } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

// Mapa de tamanhos
const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: {
    container: 'h-6 w-6',
    text: 'text-xs',
    status: 'h-1.5 w-1.5 ring-1',
  },
  sm: {
    container: 'h-8 w-8',
    text: 'text-sm',
    status: 'h-2 w-2 ring-2',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-base',
    status: 'h-2.5 w-2.5 ring-2',
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-lg',
    status: 'h-3 w-3 ring-2',
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-xl',
    status: 'h-4 w-4 ring-2',
  },
};

// Cores para o status
const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-green-500',
  offline: 'bg-surface-400',
  busy: 'bg-red-500',
  away: 'bg-amber-500',
};

// Cores de fundo para fallback baseadas no nome
const backgroundColors = [
  'bg-primary-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
];

// Função para extrair iniciais do nome
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Função para obter cor de fundo baseada no nome
function getBackgroundColor(name: string): string {
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return backgroundColors[index % backgroundColors.length];
}

export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  status,
  className = '',
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeConfig = sizeStyles[size];
  const showFallback = !src || imageError;
  const initials = name ? getInitials(name) : '?';
  const bgColor = name ? getBackgroundColor(name) : 'bg-surface-400';

  const containerStyles = `
    relative inline-flex items-center justify-center
    rounded-full overflow-hidden shrink-0
    ${sizeConfig.container}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerStyles}>
      {/* Imagem ou fallback */}
      {showFallback ? (
        <div
          className={`
            flex items-center justify-center
            w-full h-full
            ${bgColor} text-white font-medium
            ${sizeConfig.text}
          `.trim().replace(/\s+/g, ' ')}
          role="img"
          aria-label={alt || name || 'Avatar'}
        >
          {initials}
        </div>
      ) : (
        <img
          src={src!}
          alt={alt || name || 'Avatar'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
          {...props}
        />
      )}

      {/* Indicador de status */}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            rounded-full ring-white
            ${statusColors[status]}
            ${sizeConfig.status}
          `.trim().replace(/\s+/g, ' ')}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

// Componente para grupo de avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({ children, max, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const displayChildren = max ? childArray.slice(0, max) : childArray;
  const remaining = max ? childArray.length - max : 0;

  return (
    <div className="flex -space-x-2">
      {displayChildren.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-white rounded-full"
        >
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            flex items-center justify-center
            rounded-full ring-2 ring-white
            bg-surface-200 text-surface-600 font-medium
            ${sizeStyles[size].container}
            ${sizeStyles[size].text}
          `.trim().replace(/\s+/g, ' ')}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

Avatar.Group = AvatarGroup;
