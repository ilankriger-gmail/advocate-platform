import { Card } from '@/components/ui';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * SkeletonBalanceCard
 *
 * Componente de loading skeleton que imita o card de saldo de coracoes
 * com fundo gradiente e placeholders animados.
 */
export function SkeletonBalanceCard() {
  return (
    <Card
      padding="none"
      className="p-4 bg-gradient-to-r from-gray-300 to-gray-400 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Label "Seus coracoes" */}
          <Skeleton className="h-4 w-24 mb-2 bg-gray-400/50" />

          {/* Saldo de coracoes */}
          <Skeleton className="h-9 w-32 bg-gray-400/50" />
        </div>

        {/* Placeholder para o emoji */}
        <Skeleton className="w-12 h-12 rounded-full bg-gray-400/50" />
      </div>
    </Card>
  );
}
