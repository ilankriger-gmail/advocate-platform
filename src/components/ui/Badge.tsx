import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  primary: 'bg-indigo-100 text-indigo-700',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

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

// Badges pré-definidos para status comuns
export function StatusBadge({
  status,
  className,
}: {
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'draft' | 'paused';
  className?: string;
}) {
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
