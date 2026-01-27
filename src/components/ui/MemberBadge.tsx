'use client';

import { cn } from '@/lib/utils';

interface MemberBadgeProps {
  memberNumber: number | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Badge de Early Adopter
 * Mostra o número do membro para os primeiros 10.000
 */
export function MemberBadge({ memberNumber, className, size = 'sm' }: MemberBadgeProps) {
  // Só mostra para os primeiros 10.000
  if (!memberNumber || memberNumber > 10000) return null;

  // Cores especiais para os primeiros membros
  const getBadgeStyle = () => {
    if (memberNumber <= 100) {
      // Primeiros 100: Dourado premium
      return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30';
    }
    if (memberNumber <= 1000) {
      // 101-1000: Prata
      return 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-gray-900';
    }
    if (memberNumber <= 5000) {
      // 1001-5000: Bronze
      return 'bg-gradient-to-r from-orange-400 via-amber-600 to-orange-700 text-white';
    }
    // 5001-10000: Padrão
    return 'bg-gray-200 text-gray-700';
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-2 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span 
      className={cn(
        'inline-flex items-center font-bold rounded-full whitespace-nowrap ml-1.5',
        getBadgeStyle(),
        sizeClasses,
        className
      )}
      title={`Membro #${memberNumber} - Early Adopter`}
    >
      #{memberNumber.toLocaleString()}
    </span>
  );
}
