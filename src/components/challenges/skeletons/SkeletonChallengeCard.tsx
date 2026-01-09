import { Card } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Propriedades do componente SkeletonChallengeCard
 *
 * @interface SkeletonChallengeCardProps
 *
 * @example
 * // SkeletonChallengeCard básico
 * <SkeletonChallengeCard />
 *
 * @example
 * // SkeletonChallengeCard com margem customizada
 * <SkeletonChallengeCard className="mb-4" />
 *
 * @example
 * // Lista de SkeletonChallengeCards
 * <div className="space-y-4">
 *   <SkeletonChallengeCard />
 *   <SkeletonChallengeCard />
 *   <SkeletonChallengeCard />
 * </div>
 *
 * @example
 * // Grid de SkeletonChallengeCards
 * <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 *   <SkeletonChallengeCard />
 *   <SkeletonChallengeCard />
 * </div>
 */
export interface SkeletonChallengeCardProps {
  /**
   * Classes CSS adicionais para customização do container
   */
  className?: string;
}

/**
 * SkeletonChallengeCard
 *
 * Componente de loading skeleton que imita a estrutura do PhysicalChallengeCard
 * incluindo ícone circular, título com badge de status, descrição, área de meta,
 * recompensa em corações e botão de ação.
 *
 * Estrutura:
 * 1. Ícone circular
 * 2. Título com badge de status
 * 3. Descrição
 * 4. Área de meta
 * 5. Recompensa em corações
 * 6. Botão de ação
 *
 * @param {SkeletonChallengeCardProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonChallengeCard renderizado
 */
export function SkeletonChallengeCard({
  className,
}: SkeletonChallengeCardProps) {
  return (
    <Card className={`p-5 ${className || ''}`}>
      <div className="flex items-start gap-4">
        {/* (1) Ícone circular */}
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

        <div className="flex-1">
          {/* (2) Título com badge de status */}
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>

          {/* (3) Descrição */}
          <Skeleton className="h-4 w-full mt-2" />

          {/* (4) Área de meta */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg space-y-2">
            <Skeleton className="h-5 w-40 bg-blue-200/50" />
          </div>

          {/* (5) Recompensa em corações e (6) botão de ação */}
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}
