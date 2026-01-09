/**
 * Componente de spinner/loader para indicar carregamento
 *
 * Baseado no spinner utilizado no Button component, mas como componente
 * standalone reutilizável para qualquer contexto de loading.
 *
 * @example
 * // Spinner básico (tamanho médio)
 * <Spinner />
 *
 * @example
 * // Spinner pequeno
 * <Spinner size="sm" />
 *
 * @example
 * // Spinner grande
 * <Spinner size="lg" />
 *
 * @example
 * // Spinner centralizado
 * <div className="flex justify-center py-4">
 *   <Spinner />
 * </div>
 *
 * @example
 * // Spinner com label
 * <div className="flex items-center gap-2">
 *   <Spinner size="sm" />
 *   <span className="text-gray-500">Carregando...</span>
 * </div>
 */

import { cn } from '@/lib/utils';

/**
 * Tamanhos disponíveis para o Spinner
 *
 * @typedef {'sm' | 'md' | 'lg'} SpinnerSize
 *
 * - `sm`: Pequeno - 16x16px (h-4 w-4)
 * - `md`: Médio - 24x24px (h-6 w-6)
 * - `lg`: Grande - 32x32px (h-8 w-8)
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Propriedades do componente Spinner
 *
 * @interface SpinnerProps
 */
export interface SpinnerProps {
  /**
   * Tamanho do spinner
   * @default 'md'
   */
  size?: SpinnerSize;

  /**
   * Classes CSS adicionais para customização
   */
  className?: string;

  /**
   * Cor do spinner (herda currentColor por padrão)
   * Use via className (ex: "text-blue-600")
   */
}

/**
 * Componente Spinner
 *
 * Exibe um ícone animado rotativo para indicar estado de carregamento.
 * O spinner usa currentColor, permitindo fácil customização de cor via className.
 *
 * @param {SpinnerProps} props - Propriedades do componente
 * @returns {JSX.Element} Componente Spinner renderizado
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Carregando"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
