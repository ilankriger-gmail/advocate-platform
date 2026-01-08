'use client';

import { useState } from 'react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';

/**
 * Variante visual do modal de confirmação
 *
 * @typedef {'default' | 'danger'} ConfirmModalVariant
 *
 * - `default`: Modal padrão com botão de confirmação azul (ações normais)
 * - `danger`: Modal de ação destrutiva com botão vermelho (excluir, cancelar)
 */
type ConfirmModalVariant = 'default' | 'danger';

/**
 * Propriedades do componente ConfirmModal
 *
 * @interface ConfirmModalProps
 *
 * @example
 * // Modal de confirmação básico
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleConfirm}
 *   title="Confirmar ação"
 *   description="Tem certeza que deseja continuar?"
 * />
 *
 * @example
 * // Modal de confirmação para ação destrutiva (excluir)
 * <ConfirmModal
 *   isOpen={isDeleteOpen}
 *   onClose={() => setIsDeleteOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Excluir post"
 *   description="Esta ação não pode ser desfeita. O post será permanentemente removido."
 *   variant="danger"
 *   confirmText="Excluir"
 * />
 *
 * @example
 * // Modal com textos customizados
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleApprove}
 *   title="Aprovar publicação"
 *   description="O post será publicado e ficará visível para todos."
 *   confirmText="Aprovar"
 *   cancelText="Voltar"
 * />
 *
 * @example
 * // Modal com operação assíncrona
 * <ConfirmModal
 *   isOpen={isCancelOpen}
 *   onClose={() => setIsCancelOpen(false)}
 *   onConfirm={async () => {
 *     await cancelRegistration();
 *     setIsCancelOpen(false);
 *   }}
 *   title="Cancelar inscrição"
 *   description="Deseja realmente cancelar sua inscrição neste evento?"
 *   variant="danger"
 * />
 */
export interface ConfirmModalProps {
  /**
   * Controla a visibilidade do modal.
   * Quando true, o modal é exibido.
   */
  isOpen: boolean;

  /**
   * Função callback executada ao fechar o modal.
   * Chamada ao clicar no botão de cancelar, no X, no overlay ou pressionar ESC.
   */
  onClose: () => void;

  /**
   * Função callback executada ao confirmar a ação.
   * Pode ser uma função assíncrona para operações que levam tempo.
   * O modal exibe loading automaticamente durante a execução.
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Título principal exibido no header do modal.
   */
  title: string;

  /**
   * Descrição ou mensagem explicativa sobre a ação.
   * Fornece contexto adicional para o usuário.
   */
  description: string;

  /**
   * Variante visual do modal.
   * Define a cor do botão de confirmação (azul para default, vermelho para danger).
   * @default 'default'
   */
  variant?: ConfirmModalVariant;

  /**
   * Texto exibido no botão de confirmação.
   * @default 'Confirmar'
   */
  confirmText?: string;

  /**
   * Texto exibido no botão de cancelar.
   * @default 'Cancelar'
   */
  cancelText?: string;
}

/**
 * Componente ConfirmModal
 *
 * Modal de confirmação para ações simples do tipo sim/não.
 * Wrapper especializado do componente Modal base para confirmações rápidas.
 * Suporta operações assíncronas com estado de loading automático.
 *
 * Ideal para:
 * - Confirmações de exclusão (variant="danger")
 * - Confirmações de cancelamento de ações
 * - Aprovações de operações
 * - Qualquer ação que requeira confirmação do usuário
 *
 * @param {ConfirmModalProps} props - Propriedades do componente
 * @returns {JSX.Element | null} Elemento modal ou null quando fechado
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
}: ConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={handleConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
