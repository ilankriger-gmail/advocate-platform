'use client';

import { Fragment, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tamanhos disponíveis para o Modal
 *
 * @typedef {'sm' | 'md' | 'lg' | 'xl'} ModalSize
 *
 * - `sm`: Modal pequeno (max-width: 384px) - ideal para confirmações simples
 * - `md`: Modal médio (max-width: 448px) - tamanho padrão recomendado
 * - `lg`: Modal grande (max-width: 512px) - para formulários com mais campos
 * - `xl`: Modal extra grande (max-width: 576px) - para conteúdo extenso
 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Propriedades do componente Modal
 *
 * @interface ModalProps
 *
 * @example
 * // Modal básico com título e descrição
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirmar ação"
 *   description="Tem certeza que deseja continuar?"
 * >
 *   <p>Conteúdo do modal</p>
 * </Modal>
 *
 * @example
 * // Modal com tamanho customizado
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Formulário extenso"
 *   size="xl"
 * >
 *   <form>campos do formulário</form>
 * </Modal>
 *
 * @example
 * // Modal com ações usando ModalFooter
 * <Modal
 *   isOpen={isDeleteOpen}
 *   onClose={() => setIsDeleteOpen(false)}
 *   title="Excluir item"
 *   description="Esta ação não pode ser desfeita."
 *   size="sm"
 * >
 *   <p>Deseja realmente excluir este item?</p>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
 *       Cancelar
 *     </Button>
 *     <Button variant="danger" onClick={handleDelete}>
 *       Excluir
 *     </Button>
 *   </ModalFooter>
 * </Modal>
 *
 * @example
 * // Modal de formulário com validação
 * <Modal
 *   isOpen={isFormOpen}
 *   onClose={() => setIsFormOpen(false)}
 *   title="Novo usuário"
 *   description="Preencha os dados abaixo"
 *   size="lg"
 * >
 *   <form onSubmit={handleSubmit}>
 *     <Input label="Nome" value={name} onChange={setName} />
 *     <Input label="Email" value={email} onChange={setEmail} />
 *     <ModalFooter>
 *       <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
 *         Cancelar
 *       </Button>
 *       <Button type="submit" variant="primary" isLoading={isSaving}>
 *         Salvar
 *       </Button>
 *     </ModalFooter>
 *   </form>
 * </Modal>
 *
 * @example
 * // Modal sem título para conteúdo customizado
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   size="md"
 * >
 *   <div className="text-center">
 *     <img src="/success.svg" alt="Sucesso" className="mx-auto mb-4" />
 *     <h3 className="text-xl font-bold mb-2">Operação concluída!</h3>
 *     <p className="text-gray-500 mb-4">Seus dados foram salvos com sucesso.</p>
 *     <ModalFooter>
 *       <Button variant="primary" onClick={() => setIsOpen(false)}>
 *         Fechar
 *       </Button>
 *     </ModalFooter>
 *   </div>
 * </Modal>
 */
export interface ModalProps {
  /**
   * Controla a visibilidade do modal.
   * Quando true, o modal é exibido com overlay escuro sobre o conteúdo da página.
   */
  isOpen: boolean;

  /**
   * Função callback executada ao fechar o modal.
   * Chamada ao clicar no botão X, no overlay ou pressionar ESC.
   */
  onClose: () => void;

  /**
   * Conteúdo principal do modal.
   * Pode incluir qualquer elemento React, incluindo formulários e ModalFooter.
   */
  children: ReactNode;

  /**
   * Título principal exibido no header do modal.
   * Quando definido, renderiza um header com borda inferior.
   */
  title?: string;

  /**
   * Descrição ou subtítulo exibido abaixo do título.
   * Útil para fornecer contexto adicional sobre a ação do modal.
   */
  description?: string;

  /**
   * Define a largura máxima do modal.
   * @default 'md'
   */
  size?: ModalSize;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Componente Modal principal
 *
 * Diálogo modal com overlay escuro, suporte a diferentes tamanhos e fechamento via ESC/overlay/botão.
 * Renderiza sobre todo o conteúdo da página com z-index elevado e backdrop blur.
 * Inclui acessibilidade com role="dialog" e aria-modal.
 *
 * @param {ModalProps} props - Propriedades do componente
 * @returns {JSX.Element | null} Elemento modal ou null quando fechado
 */
export function Modal({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-xl shadow-xl w-full transform transition-all',
            sizeStyles[size]
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              {title && (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-gray-500"
                >
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">{children}</div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </Fragment>
  );
}

/**
 * Propriedades do componente ModalFooter
 *
 * @interface ModalFooterProps
 *
 * @example
 * // Footer com botões de ação (cancelar/confirmar)
 * <ModalFooter>
 *   <Button variant="secondary" onClick={onCancel}>
 *     Cancelar
 *   </Button>
 *   <Button variant="primary" onClick={onConfirm}>
 *     Confirmar
 *   </Button>
 * </ModalFooter>
 *
 * @example
 * // Footer com botão de exclusão
 * <ModalFooter>
 *   <Button variant="secondary" onClick={onClose}>
 *     Cancelar
 *   </Button>
 *   <Button variant="danger" onClick={onDelete} isLoading={isDeleting}>
 *     Excluir
 *   </Button>
 * </ModalFooter>
 *
 * @example
 * // Footer com apenas um botão
 * <ModalFooter>
 *   <Button variant="primary" onClick={onClose}>
 *     Fechar
 *   </Button>
 * </ModalFooter>
 *
 * @example
 * // Footer customizado com classes adicionais
 * <ModalFooter className="justify-between">
 *   <Button variant="ghost" onClick={onBack}>
 *     Voltar
 *   </Button>
 *   <div className="flex gap-3">
 *     <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
 *     <Button variant="primary" onClick={onSave}>Salvar</Button>
 *   </div>
 * </ModalFooter>
 */
interface ModalFooterProps {
  /**
   * Conteúdo do footer, geralmente botões de ação.
   * Os botões são automaticamente espaçados com gap-3.
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para customizar o layout do footer.
   * Por padrão, os botões são alinhados à direita (justify-end).
   */
  className?: string;
}

/**
 * Componente ModalFooter
 *
 * Seção de rodapé do modal com fundo cinza claro e bordas arredondadas inferiores.
 * Usado tipicamente para botões de ação como Cancelar, Salvar, Excluir, etc.
 * Os elementos são alinhados à direita por padrão com espaçamento entre eles.
 *
 * @param {ModalFooterProps} props - Propriedades do componente
 * @returns {JSX.Element} Elemento div estilizado como footer do modal
 */
export function ModalFooter({
  children,
  className,
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3',
        className
      )}
    >
      {children}
    </div>
  );
}
