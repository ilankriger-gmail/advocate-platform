'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { TierBadge, getTierByScore } from './TierBadge';
import { UserRanking } from '@/lib/supabase/types';

/**
 * Componente que mostra o ranking do usuário atual
 * Exibe posição, pontuação, tier e progresso para próximo nível
 */

interface UserRankCardProps {
  ranking: UserRanking | null;
  userName?: string | null;
  userAvatar?: string | null;
  isLoading?: boolean;
  className?: string;
}

/**
 * Thresholds para cada tier
 */
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 100,
  gold: 500,
  diamond: 1000,
};

/**
 * Função para calcular pontos necessários para o próximo tier
 */
function getPointsToNextTier(currentScore: number, currentTier: string) {
  switch (currentTier) {
    case 'bronze':
      return TIER_THRESHOLDS.silver - currentScore;
    case 'silver':
      return TIER_THRESHOLDS.gold - currentScore;
    case 'gold':
      return TIER_THRESHOLDS.diamond - currentScore;
    case 'diamond':
      return 0; // Já está no tier máximo
    default:
      return 0;
  }
}

/**
 * Função para obter nome do próximo tier
 */
function getNextTierName(currentTier: string): string | null {
  switch (currentTier) {
    case 'bronze':
      return 'Prata';
    case 'silver':
      return 'Ouro';
    case 'gold':
      return 'Diamante';
    case 'diamond':
      return null; // Já está no tier máximo
    default:
      return null;
  }
}

/**
 * Função para gerar mensagem motivacional baseada na posição
 */
function getMotivationalMessage(rank: number, totalParticipants: number, tier: string): string {
  // Top 3 posições
  if (rank === 1) {
    return '🎉 Parabéns! Você está em primeiro lugar!';
  }
  if (rank === 2) {
    return '🥈 Incrível! Continue assim para alcançar o primeiro lugar!';
  }
  if (rank === 3) {
    return '🥉 Muito bem! Você está no pódio!';
  }

  // Top 10
  if (rank <= 10) {
    return '🌟 Você está entre os 10 melhores! Continue participando!';
  }

  // Top 25
  if (rank <= 25) {
    return '💪 Você está entre os 25 melhores! Siga em frente!';
  }

  // Top 50
  if (rank <= 50) {
    return '🚀 Você está entre os 50 melhores! Continue conquistando!';
  }

  // Top 50%
  const percentile = (rank / totalParticipants) * 100;
  if (percentile <= 50) {
    return '⭐ Você está na metade superior do ranking!';
  }

  // Mensagem geral
  return '💫 Continue participando para subir no ranking!';
}

/**
 * Função para formatar número com separadores de milhar
 */
function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

/**
 * Skeleton para loading state
 */
function UserRankCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-200 rounded-full" />
            <div className="space-y-2">
              <div className="h-5 bg-surface-200 rounded w-32" />
              <div className="h-4 bg-surface-200 rounded w-24" />
            </div>
          </div>
          <div className="w-20 h-8 bg-surface-200 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 bg-surface-200 rounded w-16" />
            <div className="h-8 bg-surface-200 rounded w-20" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-200 rounded w-20" />
            <div className="h-8 bg-surface-200 rounded w-24" />
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="h-2 bg-surface-200 rounded-full w-full" />
          <div className="h-3 bg-surface-200 rounded w-40" />
        </div>

        {/* Message */}
        <div className="h-4 bg-surface-200 rounded w-full" />
      </div>
    </Card>
  );
}

/**
 * Estado quando o usuário não está ranqueado
 */
function NotRankedState() {
  return (
    <Card className="text-center py-8">
      <div className="space-y-3">
        <div className="text-5xl">📊</div>
        <h3 className="text-lg font-semibold text-surface-900">
          Você ainda não está ranqueado
        </h3>
        <p className="text-sm text-surface-500 max-w-md mx-auto">
          Complete desafios, participe de eventos e ganhe moedas para aparecer no ranking!
        </p>
      </div>
    </Card>
  );
}

export function UserRankCard({
  ranking,
  userName,
  userAvatar,
  isLoading = false,
  className,
}: UserRankCardProps) {
  // Loading state
  if (isLoading) {
    return <UserRankCardSkeleton />;
  }

  // Not ranked state
  if (!ranking) {
    return <NotRankedState />;
  }

  const pointsToNext = getPointsToNextTier(ranking.score, ranking.tier);
  const nextTier = getNextTierName(ranking.tier);
  const isMaxTier = ranking.tier === 'diamond';

  // Calcular progresso para próximo tier (0-100%)
  let progress = 0;
  if (!isMaxTier) {
    let currentTierThreshold = 0;
    let nextTierThreshold = 0;

    switch (ranking.tier) {
      case 'bronze':
        currentTierThreshold = TIER_THRESHOLDS.bronze;
        nextTierThreshold = TIER_THRESHOLDS.silver;
        break;
      case 'silver':
        currentTierThreshold = TIER_THRESHOLDS.silver;
        nextTierThreshold = TIER_THRESHOLDS.gold;
        break;
      case 'gold':
        currentTierThreshold = TIER_THRESHOLDS.gold;
        nextTierThreshold = TIER_THRESHOLDS.diamond;
        break;
    }

    const tierRange = nextTierThreshold - currentTierThreshold;
    const currentProgress = ranking.score - currentTierThreshold;
    progress = Math.min((currentProgress / tierRange) * 100, 100);
  }

  return (
    <Card className={cn('bg-gradient-to-br from-primary-50 to-white', className)}>
      <div className="space-y-4">
        {/* Header: Avatar + Nome + Tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={userAvatar}
              name={userName || 'Você'}
              size="md"
              className="ring-2 ring-primary-200"
            />
            <div>
              <p className="font-semibold text-surface-900">
                {userName || 'Você'}
              </p>
              <p className="text-sm text-surface-600">Sua posição no ranking</p>
            </div>
          </div>
          <TierBadge tier={ranking.tier} size="lg" showLabel={false} />
        </div>

        {/* Stats: Rank e Pontuação */}
        <div className="grid grid-cols-2 gap-4">
          {/* Rank */}
          <div className="bg-white rounded-lg p-3 border border-surface-100">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
              Posição
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-primary-600">
                {ranking.rank}º
              </p>
              <p className="text-xs text-surface-400">
                de {formatNumber(ranking.total_participants)}
              </p>
            </div>
          </div>

          {/* Pontuação */}
          <div className="bg-white rounded-lg p-3 border border-surface-100">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide mb-1">
              Pontuação
            </p>
            <p className="text-2xl font-bold text-surface-900">
              {formatNumber(ranking.score)}
            </p>
          </div>
        </div>

        {/* Progresso para próximo tier */}
        {!isMaxTier && nextTier && (
          <div className="bg-white rounded-lg p-3 border border-surface-100 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-surface-700">
                Progresso para {nextTier}
              </span>
              <span className="text-surface-500">
                {formatNumber(pointsToNext)} pontos restantes
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="relative h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="text-xs text-surface-500">
              {Math.round(progress)}% do caminho para {nextTier}
            </p>
          </div>
        )}

        {/* Tier máximo alcançado */}
        {isMaxTier && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 text-center">
              🎉 Você alcançou o tier máximo: Diamante!
            </p>
          </div>
        )}

        {/* Mensagem motivacional */}
        <div className="bg-primary-100/50 rounded-lg p-3 border border-primary-200/50">
          <p className="text-sm text-primary-900 text-center font-medium">
            {getMotivationalMessage(ranking.rank, ranking.total_participants, ranking.tier)}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Variante compacta do UserRankCard para widgets/previews
 */
export function UserRankCardCompact({
  ranking,
  userName,
  userAvatar,
  isLoading = false,
  className,
}: UserRankCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card padding="sm" className={cn('overflow-hidden', className)}>
        <div className="animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-surface-200 rounded-full" />
            <div className="space-y-1">
              <div className="h-4 bg-surface-200 rounded w-16" />
              <div className="h-3 bg-surface-200 rounded w-12" />
            </div>
          </div>
          <div className="w-12 h-6 bg-surface-200 rounded-full" />
        </div>
      </Card>
    );
  }

  // Not ranked state
  if (!ranking) {
    return (
      <Card padding="sm" className={cn('text-center', className)}>
        <p className="text-xs text-surface-500">Não ranqueado</p>
      </Card>
    );
  }

  return (
    <Card padding="sm" className={cn('bg-primary-50/50', className)}>
      <div className="flex items-center justify-between gap-3">
        {/* Avatar + Info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar
            src={userAvatar}
            name={userName || 'Você'}
            size="sm"
            className="ring-1 ring-primary-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 truncate">
              {userName || 'Você'}
            </p>
            <p className="text-xs text-surface-500">
              {ranking.rank}º lugar • {formatNumber(ranking.score)} pts
            </p>
          </div>
        </div>

        {/* Tier */}
        <TierBadge tier={ranking.tier} size="sm" showLabel={false} />
      </div>
    </Card>
  );
}

// Exportar variante compacta como propriedade do componente principal
UserRankCard.Compact = UserRankCardCompact;
