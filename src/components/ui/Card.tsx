import { type HTMLAttributes, type ReactNode } from 'react';

// Variantes de padding do card
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  hover?: boolean;
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

// Mapa de estilos de padding
const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

// Componente Card principal
export function Card({
  padding = 'md',
  hover = false,
  className = '',
  children,
  ...props
}: CardProps) {
  const cardStyles = `
    bg-white border border-surface-200 rounded-2xl shadow-soft
    ${paddingStyles[padding]}
    ${hover ? 'transition-shadow duration-200 hover:shadow-soft-lg' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardStyles} {...props}>
      {children}
    </div>
  );
}

// Subcomponente Header
export function CardHeader({
  title,
  description,
  action,
  className = '',
  children,
  ...props
}: CardHeaderProps) {
  const headerStyles = `
    flex items-start justify-between gap-4
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Se tiver children, renderiza diretamente
  if (children) {
    return (
      <div className={headerStyles} {...props}>
        {children}
      </div>
    );
  }

  // Renderiza com title/description/action
  return (
    <div className={headerStyles} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-surface-900 truncate">
            {title}
          </h3>
        )}
        {description && (
          <p className="mt-1 text-sm text-surface-500">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Subcomponente Content
export function CardContent({
  className = '',
  children,
  ...props
}: CardContentProps) {
  const contentStyles = `
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={contentStyles} {...props}>
      {children}
    </div>
  );
}

// Subcomponente Footer
export function CardFooter({
  className = '',
  children,
  ...props
}: CardFooterProps) {
  const footerStyles = `
    flex items-center justify-end gap-3
    pt-4 mt-4 border-t border-surface-100
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={footerStyles} {...props}>
      {children}
    </div>
  );
}

// Atribuição de subcomponentes
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
