import { cn } from '@/lib/utils';
import { LeaderboardTier } from '@/lib/supabase/types';

/**
 * Componente de badge para exibir o tier de reconhecimento do usuário
 * Bronze (0-99), Silver (100-499), Gold (500-999), Diamond (1000+)
 */

interface TierBadgeProps {
  tier: LeaderboardTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Configuração de cores e labels para cada tier
const tierConfig = {
  bronze: {
    label: 'Bronze',
    bgColor: 'bg-amber-900/10',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-900/20',
    iconColor: 'text-amber-700',
  },
  silver: {
    label: 'Prata',
    bgColor: 'bg-gray-400/10',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-400/20',
    iconColor: 'text-gray-500',
  },
  gold: {
    label: 'Ouro',
    bgColor: 'bg-yellow-500/10',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500/20',
    iconColor: 'text-yellow-600',
  },
  diamond: {
    label: 'Diamante',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-500/20',
    iconColor: 'text-blue-600',
  },
};

const sizeStyles = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'px-2.5 py-1.5 text-sm gap-1.5',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'px-3 py-2 text-base gap-2',
    icon: 'w-5 h-5',
  },
};

// Ícones SVG para cada tier
const TierIcon = ({ tier, size = 'md' }: { tier: LeaderboardTier; size?: 'sm' | 'md' | 'lg' }) => {
  const config = tierConfig[tier];
  const iconSize = sizeStyles[size].icon;

  // Ícone de medalha/troféu baseado no tier
  switch (tier) {
    case 'bronze':
      return (
        <svg
          className={cn(iconSize, config.iconColor)}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M10 12a5 5 0 100-10 5 5 0 000 10z" />
          <path d="M10 13a8 8 0 00-8 8h16a8 8 0 00-8-8z" opacity="0.5" />
        </svg>
      );
    case 'silver':
      return (
        <svg
          className={cn(iconSize, config.iconColor)}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case 'gold':
      return (
        <svg
          className={cn(iconSize, config.iconColor)}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg
          className={cn(iconSize, config.iconColor)}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
};

export function TierBadge({ tier, size = 'md', showLabel = true, className }: TierBadgeProps) {
  const config = tierConfig[tier];
  const sizes = sizeStyles[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizes.container,
        className
      )}
    >
      <TierIcon tier={tier} size={size} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

/**
 * Função auxiliar para determinar o tier baseado na pontuação
 */
export function getTierByScore(score: number): LeaderboardTier {
  if (score >= 1000) return 'diamond';
  if (score >= 500) return 'gold';
  if (score >= 100) return 'silver';
  return 'bronze';
}
