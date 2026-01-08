'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Propriedades do componente Textarea
 *
 * @interface TextareaProps
 * @extends {TextareaHTMLAttributes<HTMLTextAreaElement>}
 *
 * @example
 * // Textarea básico com label
 * <Textarea label="Descrição" placeholder="Digite sua descrição..." />
 *
 * @example
 * // Textarea com mensagem de erro (validação)
 * <Textarea
 *   label="Comentário"
 *   error="O comentário deve ter pelo menos 10 caracteres"
 *   value={comment}
 * />
 *
 * @example
 * // Textarea com texto de ajuda
 * <Textarea
 *   label="Biografia"
 *   hint="Conte um pouco sobre você (máximo 500 caracteres)"
 *   placeholder="Digite sua biografia..."
 *   maxLength={500}
 * />
 *
 * @example
 * // Textarea com número de linhas customizado
 * <Textarea
 *   label="Observações"
 *   rows={5}
 *   placeholder="Adicione suas observações aqui..."
 * />
 *
 * @example
 * // Textarea com validação e dica
 * <Textarea
 *   label="Feedback"
 *   error={feedbackError}
 *   hint={!feedbackError ? "Seu feedback é importante para nós" : undefined}
 *   value={feedback}
 *   onChange={handleFeedbackChange}
 * />
 */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Texto do label exibido acima do campo de textarea.
   * Quando fornecido, cria um elemento <label> acessível associado ao textarea.
   */
  label?: string;

  /**
   * Mensagem de erro exibida abaixo do textarea.
   * Quando presente, o textarea é estilizado com borda vermelha e a mensagem
   * aparece em vermelho. Sobrepõe o hint se ambos estiverem presentes.
   */
  error?: string;

  /**
   * Texto de ajuda exibido abaixo do textarea.
   * Fornece orientações adicionais ao usuário. Ocultado quando há um erro.
   */
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'block w-full px-3 py-2 border rounded-lg shadow-sm transition-colors',
            'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'resize-y min-h-[100px]',
            error
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
