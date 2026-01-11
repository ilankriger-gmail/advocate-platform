import { cn } from '@/lib/utils';

/**
 * Variantes de estilo disponíveis para o badge
 *
 * @typedef {'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'} BadgeVariant
 *
 * - `default`: Badge padrão com fundo cinza (uso geral)
 * - `success`: Badge verde para indicar sucesso ou status positivo
 * - `warning`: Badge amarelo para indicar avisos ou atenção necessária
 * - `error`: Badge vermelho para indicar erros ou status negativo
 * - `info`: Badge azul para informações gerais
 * - `primary`: Badge roxo/índigo para destaque ou elementos primários
 */
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'gradient';

/**
 * Tamanhos disponíveis para o badge
 *
 * @typedef {'sm' | 'md' | 'lg'} BadgeSize
 *
 * - `sm`: Pequeno - texto xs, padding reduzido
 * - `md`: Médio - tamanho padrão recomendado
 * - `lg`: Grande - texto base, maior destaque
 */
type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Propriedades do componente Badge
 *
 * @interface BadgeProps
 *
 * @example
 * // Badge básico
 * <Badge>Novo</Badge>
 *
 * @example
 * // Badge de sucesso
 * <Badge variant="success">Aprovado</Badge>
 *
 * @example
 * // Badge de aviso com tamanho pequeno
 * <Badge variant="warning" size="sm">Pendente</Badge>
 *
 * @example
 * // Badge de erro grande
 * <Badge variant="error" size="lg">Rejeitado</Badge>
 *
 * @example
 * // Badge customizado com className
 * <Badge variant="primary" className="uppercase font-bold">
 *   Premium
 * </Badge>
 */
export interface BadgeProps {
  /**
   * Conteúdo exibido dentro do badge
   */
  children: React.ReactNode;

  /**
   * Variante visual do badge
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Tamanho do badge
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-100 text-surface-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  primary: 'bg-primary-100 text-primary-700',
  gradient: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

/**
 * Componente Badge para exibir etiquetas, tags ou status visuais
 *
 * Um badge é um elemento visual compacto usado para destacar informações,
 * categorias, status ou contadores. Suporta múltiplas variantes de cor e tamanhos.
 *
 * @component
 * @param {BadgeProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento badge renderizado
 */
export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Status disponíveis para o StatusBadge
 *
 * @typedef {'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'draft' | 'paused'} BadgeStatus
 *
 * - `pending`: Pendente - exibe "Pendente" com variante warning (amarelo)
 * - `approved`: Aprovado - exibe "Aprovado" com variante success (verde)
 * - `rejected`: Rejeitado - exibe "Rejeitado" com variante error (vermelho)
 * - `active`: Ativo - exibe "Ativo" com variante success (verde)
 * - `completed`: Concluído - exibe "Concluído" com variante info (azul)
 * - `draft`: Rascunho - exibe "Rascunho" com variante default (cinza)
 * - `paused`: Pausado - exibe "Pausado" com variante warning (amarelo)
 */
type BadgeStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'draft' | 'paused';

/**
 * Propriedades do componente StatusBadge
 *
 * @interface StatusBadgeProps
 *
 * @example
 * // Badge de status pendente
 * <StatusBadge status="pending" />
 *
 * @example
 * // Badge de status aprovado
 * <StatusBadge status="approved" />
 *
 * @example
 * // Badge de status ativo
 * <StatusBadge status="active" />
 *
 * @example
 * // Badge de status concluído
 * <StatusBadge status="completed" />
 *
 * @example
 * // Badge de status rejeitado customizado
 * <StatusBadge status="rejected" className="text-xs" />
 */
interface StatusBadgeProps {
  /**
   * Status a ser exibido. Define automaticamente o texto e a cor do badge.
   */
  status: BadgeStatus;

  /**
   * Classes CSS adicionais para customização
   */
  className?: string;
}

/**
 * Componente StatusBadge para exibir status pré-definidos
 *
 * Um atalho conveniente para exibir status comuns da aplicação com
 * textos e cores padronizados. Utiliza o componente Badge internamente.
 *
 * @component
 * @param {StatusBadgeProps} props - Propriedades do componente
 * @returns {JSX.Element} Badge de status renderizado
 */
export function StatusBadge({
  status,
  className,
}: StatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pendente', variant: 'warning' as const },
    approved: { label: 'Aprovado', variant: 'success' as const },
    rejected: { label: 'Rejeitado', variant: 'error' as const },
    active: { label: 'Ativo', variant: 'success' as const },
    completed: { label: 'Concluído', variant: 'info' as const },
    draft: { label: 'Rascunho', variant: 'default' as const },
    paused: { label: 'Pausado', variant: 'warning' as const },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
