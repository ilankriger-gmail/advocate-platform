'use client';

import { useState, useEffect, useRef } from 'react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

/**
 * Propriedades do componente PromptModal
 *
 * @interface PromptModalProps
 *
 * @example
 * // Modal de prompt básico
 * <PromptModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={handleSubmit}
 *   title="Informe o motivo"
 *   description="Por favor, descreva o motivo da sua ação."
 * />
 *
 * @example
 * // Modal de prompt com validação e placeholder
 * <PromptModal
 *   isOpen={isRejectOpen}
 *   onClose={() => setIsRejectOpen(false)}
 *   onSubmit={handleReject}
 *   title="Rejeitar publicação"
 *   description="Informe o motivo da rejeição para o autor."
 *   placeholder="Digite o motivo..."
 *   required
 * />
 *
 * @example
 * // Modal de prompt com valor inicial
 * <PromptModal
 *   isOpen={isEditOpen}
 *   onClose={() => setIsEditOpen(false)}
 *   onSubmit={handleEdit}
 *   title="Editar URL"
 *   description="Atualize a URL do link."
 *   initialValue={currentUrl}
 *   placeholder="https://exemplo.com"
 * />
 *
 * @example
 * // Modal de prompt com textos customizados
 * <PromptModal
 *   isOpen={isInputOpen}
 *   onClose={() => setIsInputOpen(false)}
 *   onSubmit={handleInput}
 *   title="Adicionar tag"
 *   description="Digite o nome da nova tag."
 *   placeholder="nome-da-tag"
 *   submitText="Adicionar"
 *   cancelText="Voltar"
 *   required
 * />
 *
 * @example
 * // Modal com operação assíncrona
 * <PromptModal
 *   isOpen={isPromptOpen}
 *   onClose={() => setIsPromptOpen(false)}
 *   onSubmit={async (value) => {
 *     await saveValue(value);
 *     setIsPromptOpen(false);
 *   }}
 *   title="Informe o nome"
 *   description="Este nome será usado para identificar o item."
 *   required
 * />
 */
export interface PromptModalProps {
  /**
   * Controla a visibilidade do modal.
   * Quando true, o modal é exibido e o input recebe foco automático.
   */
  isOpen: boolean;

  /**
   * Função callback executada ao fechar o modal.
   * Chamada ao clicar no botão de cancelar, no X, no overlay ou pressionar ESC.
   */
  onClose: () => void;

  /**
   * Função callback executada ao submeter o formulário.
   * Recebe o valor digitado no input como parâmetro.
   * Pode ser uma função assíncrona para operações que levam tempo.
   * O modal exibe loading automaticamente durante a execução.
   */
  onSubmit: (value: string) => void | Promise<void>;

  /**
   * Título principal exibido no header do modal.
   */
  title: string;

  /**
   * Descrição ou mensagem explicativa sobre o input solicitado.
   * Fornece contexto adicional para o usuário.
   */
  description: string;

  /**
   * Texto de placeholder exibido no input quando vazio.
   * @default 'Digite aqui...'
   */
  placeholder?: string;

  /**
   * Valor inicial do input.
   * Útil ao editar valores existentes.
   * @default ''
   */
  initialValue?: string;

  /**
   * Define se o campo é obrigatório.
   * Quando true, o botão de submit é desabilitado se o input estiver vazio.
   * @default false
   */
  required?: boolean;

  /**
   * Texto exibido no botão de submit.
   * @default 'Confirmar'
   */
  submitText?: string;

  /**
   * Texto exibido no botão de cancelar.
   * @default 'Cancelar'
   */
  cancelText?: string;
}

/**
 * Componente PromptModal
 *
 * Modal de input para solicitar informações ao usuário via campo de texto.
 * Wrapper especializado do componente Modal base para coletar dados do usuário.
 * Suporta operações assíncronas com estado de loading automático.
 * Auto-foca o input ao abrir e permite submissão via tecla Enter.
 *
 * Ideal para:
 * - Solicitar motivo de rejeição ou cancelamento
 * - Editar URLs ou nomês de itens
 * - Adicionar tags ou categorias
 * - Qualquer input de texto simples que requeira confirmação
 *
 * @param {PromptModalProps} props - Propriedades do componente
 * @returns {JSX.Element | null} Elemento modal ou null quando fechado
 */
export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  placeholder = 'Digite aqui...',
  initialValue = '',
  required = false,
  submitText = 'Confirmar',
  cancelText = 'Cancelar',
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when modal opens/closes or initialValue changes
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      // Auto-focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Prevent submission if required and empty
    if (required && !value.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(value);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = required && !value.trim();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <form onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          required={required}
        />

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={isSubmitDisabled}
            type="submit"
          >
            {submitText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
