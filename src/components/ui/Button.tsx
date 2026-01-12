'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/**
 * Variantes de estilo disponíveis para o botão
 *
 * @typedef {'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'} ButtonVariant
 *
 * - `primary`: Botão principal com fundo azul (ações primárias)
 * - `secondary`: Botão secundário com fundo cinza claro (ações secundárias)
 * - `outline`: Botão com borda e fundo transparente (ações alternativas)
 * - `ghost`: Botão sem borda e fundo transparente (ações sutis)
 * - `danger`: Botão vermelho para ações destrutivas (excluir, cancelar)
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Tamanhos disponíveis para o botão
 *
 * @typedef {'sm' | 'md' | 'lg'} ButtonSize
 *
 * - `sm`: Pequeno - altura reduzida, ideal para espaços compactos
 * - `md`: Médio - tamanho padrão recomendado
 * - `lg`: Grande - maior destaque, ideal para CTAs principais
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Propriedades do componente Button
 *
 * @interface ButtonProps
 * @extends {ButtonHTMLAttributes<HTMLButtonElement>}
 *
 * @example
 * // Botão primário básico
 * <Button>Salvar</Button>
 *
 * @example
 * // Botão com loading
 * <Button isLoading={isSaving}>Salvando...</Button>
 *
 * @example
 * // Botão com ícones
 * <Button leftIcon={<IconPlus />} variant="secondary">
 *   Adicionar Item
 * </Button>
 *
 * @example
 * // Botão de largura completa
 * <Button fullWidth variant="primary">
 *   Confirmar
 * </Button>
 *
 * @example
 * // Botão danger com ícone à direita
 * <Button variant="danger" rightIcon={<IconTrash />}>
 *   Excluir
 * </Button>
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Variante visual do botão
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Tamanho do botão
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Indica se o botão está em estado de carregamento.
   * Quando true, exibe um spinner e desabilita o botão.
   * @default false
   */
  isLoading?: boolean;

  /**
   * Ícone exibido à esquerda do texto do botão.
   * Substituído pelo spinner quando isLoading=true.
   */
  leftIcon?: ReactNode;

  /**
   * Ícone exibido à direita do texto do botão.
   * Ocultado quando isLoading=true.
   */
  rightIcon?: ReactNode;

  /**
   * Se true, o botão ocupa toda a largura disponível do container pai.
   * @default false
   */
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
    shadow-lg shadow-primary-500/25
  `,
  secondary: `
    bg-primary-100 text-primary-700
    hover:bg-primary-200
    focus:ring-primary-400
  `,
  outline: `
    border-2 border-primary-300 bg-transparent text-primary-700
    hover:bg-primary-50 hover:border-primary-400
    focus:ring-primary-400
  `,
  ghost: `
    bg-transparent text-primary-600
    hover:bg-primary-50
    focus:ring-primary-400
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500
  `,
};

// Mapa de tamanhos (min-h-[44px] garante touch target WCAG 2.2 AAA)
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-[44px]',
  md: 'px-4 py-2.5 text-sm min-h-[44px]',
  lg: 'px-6 py-3.5 text-base min-h-[48px]',
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
