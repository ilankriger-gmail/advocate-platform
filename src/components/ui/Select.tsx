'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Opção individual para o componente Select
 *
 * @interface SelectOption
 *
 * @example
 * const option: SelectOption = {
 *   value: 'br',
 *   label: 'Brasil'
 * }
 *
 * @example
 * // Opção desabilitada
 * const disabledOption: SelectOption = {
 *   value: 'unavailable',
 *   label: 'Indisponível',
 *   disabled: true
 * }
 */
export interface SelectOption {
  /**
   * Valor único que será submetido quando a opção for selecionada.
   * Usado como valor do atributo value do <option>.
   */
  value: string;

  /**
   * Texto exibido ao usuário para esta opção.
   */
  label: string;

  /**
   * Se true, a opção não pode ser selecionada pelo usuário.
   * Útil para opções temporariamente indisponíveis.
   * @default false
   */
  disabled?: boolean;
}

/**
 * Propriedades do componente Select
 *
 * @interface SelectProps
 * @extends {SelectHTMLAttributes<HTMLSelectElement>}
 *
 * @example
 * // Select básico com label
 * <Select
 *   label="País"
 *   options={[
 *     { value: 'br', label: 'Brasil' },
 *     { value: 'us', label: 'Estados Unidos' },
 *     { value: 'pt', label: 'Portugal' }
 *   ]}
 * />
 *
 * @example
 * // Select com placeholder
 * <Select
 *   label="Estado"
 *   placeholder="Selecione um estado"
 *   options={estados}
 * />
 *
 * @example
 * // Select com mensagem de erro (validação)
 * <Select
 *   label="Categoria"
 *   error="Categoria é obrigatória"
 *   options={categorias}
 *   value={selectedCategory}
 * />
 *
 * @example
 * // Select com texto de ajuda
 * <Select
 *   label="Nível de experiência"
 *   hint="Escolha o nível que melhor descreve sua experiência"
 *   options={[
 *     { value: 'iniciante', label: 'Iniciante' },
 *     { value: 'intermediario', label: 'Intermediário' },
 *     { value: 'avancado', label: 'Avançado' }
 *   ]}
 * />
 *
 * @example
 * // Select com opções desabilitadas
 * <Select
 *   label="Plano"
 *   options={[
 *     { value: 'free', label: 'Gratuito' },
 *     { value: 'pro', label: 'Pro' },
 *     { value: 'enterprise', label: 'Enterprise', disabled: true }
 *   ]}
 * />
 */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Texto do label exibido acima do campo de select.
   * Quando fornecido, cria um elemento <label> acessível associado ao select.
   */
  label?: string;

  /**
   * Mensagem de erro exibida abaixo do select.
   * Quando presente, o select é estilizado com borda vermelha e a mensagem
   * aparece em vermelho. Sobrepõe o hint se ambos estiverem presentes.
   */
  error?: string;

  /**
   * Texto de ajuda exibido abaixo do select.
   * Fornece orientações adicionais ao usuário. Ocultado quando há um erro.
   */
  hint?: string;

  /**
   * Array de opções disponíveis no select.
   * Cada opção deve ter um value único e um label para exibição.
   * Opções podem ser marcadas como disabled.
   */
  options: SelectOption[];

  /**
   * Texto exibido como primeira opção quando nenhum valor está selecionado.
   * A opção de placeholder é sempre desabilitada e tem value vazio.
   * Útil para forçar o usuário a fazer uma seleção explícita.
   */
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors',
              'bg-white appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          {/* Ícone de seta */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
