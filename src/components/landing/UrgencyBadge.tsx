'use client';

import { AlertCircle, Users, Package, Gift, TrendingUp } from 'lucide-react';

interface UrgencyBadgeProps {
  type: 'limited_spots' | 'low_stock' | 'popular' | 'ending_soon';
  value?: number;
  className?: string;
}

export function UrgencyBadge({ type, value, className = '' }: UrgencyBadgeProps) {
  const configs = {
    limited_spots: {
      icon: Users,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-200',
      getMessage: (v?: number) => v ? `Apenas ${v} vagas restantes!` : 'Vagas limitadas!',
    },
    low_stock: {
      icon: Package,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      getMessage: (v?: number) => v ? `Apenas ${v} ${v === 1 ? 'unidade' : 'unidades'} restante${v === 1 ? '' : 's'}!` : 'Estoque limitado!',
    },
    popular: {
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      getMessage: (v?: number) => v ? `${v}+ pessoas participando!` : 'Popular!',
    },
    ending_soon: {
      icon: AlertCircle,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
      getMessage: () => 'Termina em breve!',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor} ${className}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{config.getMessage(value)}</span>
    </div>
  );
}

interface ScarcityIndicatorProps {
  quantityAvailable?: number | null;
  participantsCount?: number;
  endsAt?: string | null;
  type: 'challenge' | 'reward';
  className?: string;
}

export function ScarcityIndicator({
  quantityAvailable,
  participantsCount,
  endsAt,
  type,
  className = '',
}: ScarcityIndicatorProps) {
  const badges: React.ReactNode[] = [];

  // Badge de estoque baixo para prêmios
  if (type === 'reward' && quantityAvailable !== null && quantityAvailable !== undefined) {
    if (quantityAvailable <= 5 && quantityAvailable > 0) {
      badges.push(
        <UrgencyBadge key="stock" type="low_stock" value={quantityAvailable} />
      );
    }
  }

  // Badge de popularidade para desafios
  if (type === 'challenge' && participantsCount && participantsCount >= 10) {
    badges.push(
      <UrgencyBadge key="popular" type="popular" value={participantsCount} />
    );
  }

  // Badge de tempo limitado
  if (endsAt) {
    const endDate = new Date(endsAt);
    const now = new Date();
    const hoursLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft > 0 && hoursLeft <= 48) {
      badges.push(
        <UrgencyBadge key="ending" type="ending_soon" />
      );
    }
  }

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 justify-center ${className}`}>
      {badges}
    </div>
  );
}
