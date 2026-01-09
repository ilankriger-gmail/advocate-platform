import { Card } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Propriedades do componente SkeletonEventCard
 *
 * @interface SkeletonEventCardProps
 *
 * @example
 * // SkeletonEventCard básico
 * <SkeletonEventCard />
 *
 * @example
 * // SkeletonEventCard com margem customizada
 * <SkeletonEventCard className="mb-4" />
 *
 * @example
 * // Lista de SkeletonEventCards
 * <div className="space-y-4">
 *   <SkeletonEventCard />
 *   <SkeletonEventCard />
 *   <SkeletonEventCard />
 * </div>
 *
 * @example
 * // Grid de SkeletonEventCards
 * <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 *   <SkeletonEventCard />
 *   <SkeletonEventCard />
 * </div>
 */
export interface SkeletonEventCardProps {
  /**
   * Classes CSS adicionais para customização do container
   */
  className?: string;
}

/**
 * SkeletonEventCard
 *
 * Componente de loading skeleton que imita a estrutura do EventCard
 * incluindo imagem, badges, título, data/hora, local, nível requerido,
 * descrição e botão de ação.
 *
 * Estrutura:
 * 1. Div de imagem/gradiente com placeholder
 * 2. Área de badges
 * 3. Título
 * 4. Data e hora
 * 5. Local
 * 6. Nível requerido
 * 7. Descrição
 * 8. Botão de ação
 *
 * @param {SkeletonEventCardProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente SkeletonEventCard renderizado
 */
export function SkeletonEventCard({ className }: SkeletonEventCardProps) {
  return (
    <Card className={`overflow-hidden ${className || ''}`}>
      {/* (1) Imagem/gradiente placeholder */}
      <div className="relative h-40 bg-gradient-to-br from-gray-300 to-gray-400">
        {/* Placeholder para ícone de evento */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-16 h-16 rounded bg-gray-400/50" />
        </div>

        {/* (2) Área de badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full bg-gray-400/50" />
          <Skeleton className="h-6 w-20 rounded-full bg-gray-400/50" />
        </div>

        {/* Badge de status (direita) */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full bg-gray-400/50" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* (3) Título */}
        <Skeleton className="h-5 w-3/4" />

        {/* (4) Data e hora */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-px" />
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* (5) Local */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* (6) Nível requerido */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded" />
          <Skeleton className="h-4 w-36" />
        </div>

        {/* (7) Descrição */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* (8) Botão de ação */}
        <div className="pt-2">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
