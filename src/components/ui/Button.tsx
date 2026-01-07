'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// Variantes de estilo do botão
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

// Estilos base compartilhados
const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium transition-all duration-200
  rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-[0.98]
`;

// Mapa de estilos por variante
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-primary-600 text-white
    hover:bg-primary-700
    focus:ring-primary-500
  `,
  secondary: `
    bg-surface-100 text-surface-900
    hover:bg-surface-200
    focus:ring-surface-400
  `,
  outline: `
    border-2 border-surface-300 bg-transparent text-surface-700
    hover:bg-surface-50 hover:border-surface-400
    focus:ring-surface-400
  `,
  ghost: `
    bg-transparent text-surface-700
    hover:bg-surface-100
    focus:ring-surface-400
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500
  `,
};

// Mapa de tamanhos
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

// Componente de loading spinner
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        {children}

        {rightIcon && !isLoading && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
