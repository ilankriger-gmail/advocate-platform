'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    // Gera um ID único caso não seja fornecido
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    const inputStyles = `
      w-full px-4 py-2.5
      bg-white border rounded-xl
      text-surface-900 placeholder:text-surface-400
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:bg-surface-50 disabled:text-surface-500 disabled:cursor-not-allowed
      ${leftIcon ? 'pl-11' : ''}
      ${rightIcon ? 'pr-11' : ''}
      ${error
        ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
        : 'border-surface-300 focus:border-primary-500 focus:ring-primary-200'
      }
      ${className}
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-700 mb-1.5"
          >
            {label}
          </label>
        )}

        {/* Campo de input com ícones */}
        <div className="relative">
          {/* Ícone esquerdo */}
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={inputStyles}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {/* Ícone direito */}
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Texto de ajuda */}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1.5 text-sm text-surface-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
