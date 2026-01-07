'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tipos de toast disponíveis
 *
 * @typedef {'success' | 'error' | 'warning' | 'info'} ToastType
 *
 * - `success`: Toast verde para indicar sucesso de operações (ex: "Salvo com sucesso")
 * - `error`: Toast vermelho para indicar erros (ex: "Falha ao salvar")
 * - `warning`: Toast amarelo para avisos importantes (ex: "Atenção: limite próximo")
 * - `info`: Toast azul para informações gerais (ex: "Novo recurso disponível")
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface do objeto Toast
 *
 * Representa uma notificação temporária exibida na tela
 *
 * @interface Toast
 *
 * @example
 * // Toast de sucesso básico
 * const toast: Toast = {
 *   id: '123',
 *   type: 'success',
 *   title: 'Salvo com sucesso'
 * }
 *
 * @example
 * // Toast com mensagem detalhada
 * const toast: Toast = {
 *   id: '456',
 *   type: 'error',
 *   title: 'Erro ao salvar',
 *   message: 'Verifique sua conexão e tente novamente'
 * }
 *
 * @example
 * // Toast com duração customizada
 * const toast: Toast = {
 *   id: '789',
 *   type: 'warning',
 *   title: 'Atenção',
 *   message: 'Esta ação não pode ser desfeita',
 *   duration: 10000 // 10 segundos
 * }
 */
export interface Toast {
  /**
   * Identificador único do toast.
   * Gerado automaticamente pelo sistema.
   */
  id: string;

  /**
   * Tipo visual e semântico do toast.
   * Define a cor e o ícone exibidos.
   */
  type: ToastType;

  /**
   * Título principal do toast.
   * Texto curto e direto (ex: "Sucesso", "Erro ao salvar").
   */
  title: string;

  /**
   * Mensagem detalhada opcional.
   * Complementa o título com informações adicionais.
   */
  message?: string;

  /**
   * Duração em milissegundos antes de fechar automaticamente.
   * Use 0 para toast que não fecha automaticamente.
   * @default 5000
   */
  duration?: number;
}

/**
 * Valor do contexto de toasts
 * @internal
 */
interface ToastContextValue {
  /** Lista de todos os toasts atualmente visíveis */
  toasts: Toast[];
  /** Adiciona um novo toast à lista */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** Remove um toast específico pelo ID */
  removeToast: (id: string) => void;
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook para acessar o sistema de toasts
 *
 * Retorna funções para adicionar e remover toasts da aplicação.
 * Deve ser usado dentro de um ToastProvider.
 *
 * @throws {Error} Se usado fora de um ToastProvider
 *
 * @returns {ToastContextValue} Objeto com toasts, addToast e removeToast
 *
 * @example
 * // Uso básico do hook
 * function MyComponent() {
 *   const { addToast } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       addToast({
 *         type: 'success',
 *         title: 'Salvo com sucesso'
 *       });
 *     } catch (error) {
 *       addToast({
 *         type: 'error',
 *         title: 'Erro ao salvar',
 *         message: error.message
 *       });
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Salvar</button>;
 * }
 *
 * @example
 * // Toast com duração customizada
 * function MyComponent() {
 *   const { addToast } = useToast();
 *
 *   const showWarning = () => {
 *     addToast({
 *       type: 'warning',
 *       title: 'Atenção',
 *       message: 'Esta ação não pode ser desfeita',
 *       duration: 10000 // 10 segundos
 *     });
 *   };
 *
 *   return <button onClick={showWarning}>Mostrar Aviso</button>;
 * }
 *
 * @example
 * // Remover toast manualmente
 * function MyComponent() {
 *   const { toasts, removeToast } = useToast();
 *
 *   return (
 *     <div>
 *       {toasts.map(toast => (
 *         <button key={toast.id} onClick={() => removeToast(toast.id)}>
 *           Fechar: {toast.title}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Propriedades do ToastProvider
 *
 * @interface ToastProviderProps
 *
 * @example
 * // Uso básico no layout da aplicação
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <ToastProvider>
 *           {children}
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * @example
 * // Uso em uma seção específica da aplicação
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <ToastProvider>
 *       <DashboardHeader />
 *       <main>{children}</main>
 *       <DashboardFooter />
 *     </ToastProvider>
 *   );
 * }
 */
interface ToastProviderProps {
  /**
   * Componentes filhos que terão acesso ao sistema de toasts.
   * Use o hook useToast() dentro desses componentes para exibir notificações.
   */
  children: ReactNode;
}

/**
 * Provedor de contexto para o sistema de toasts
 *
 * Componente que deve envolver toda a aplicação ou seção onde
 * os toasts serão utilizados. Gerencia o estado e renderização
 * de todas as notificações toast.
 *
 * @component
 *
 * @example
 * // Configuração no layout raiz (recomendado)
 * import { ToastProvider } from '@/components/ui/Toast';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="pt-BR">
 *       <body>
 *         <ToastProvider>
 *           {children}
 *         </ToastProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * @example
 * // Uso em múltiplas páginas após configuração
 * // pages/dashboard.tsx
 * function Dashboard() {
 *   const { addToast } = useToast(); // Funciona porque está dentro do ToastProvider
 *
 *   return <button onClick={() => addToast({ type: 'success', title: 'OK!' })}>
 *     Mostrar Toast
 *   </button>;
 * }
 *
 * @example
 * // ToastProvider em uma feature específica
 * function MessagingFeature() {
 *   return (
 *     <ToastProvider>
 *       <MessageList />
 *       <MessageComposer />
 *     </ToastProvider>
 *   );
 * }
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Container
function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// Item
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right',
        typeStyles[toast.type]
      )}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Hook auxiliar com atalhos para tipos específicos de toast
 *
 * Fornece funções convenientes para exibir toasts sem precisar
 * especificar o tipo manualmente. Simplifica o código quando você
 * precisa exibir notificações frequentemente.
 *
 * @returns {Object} Objeto com funções success, error, warning e info
 *
 * @example
 * // Uso básico com atalhos de tipo
 * function MyForm() {
 *   const toast = useToastHelpers();
 *
 *   const handleSubmit = async (data) => {
 *     try {
 *       await api.save(data);
 *       toast.success('Salvo com sucesso');
 *     } catch (error) {
 *       toast.error('Erro ao salvar', error.message);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 *
 * @example
 * // Usando diferentes tipos de toast
 * function NotificationDemo() {
 *   const toast = useToastHelpers();
 *
 *   return (
 *     <div>
 *       <button onClick={() => toast.success('Operação concluída!')}>
 *         Sucesso
 *       </button>
 *       <button onClick={() => toast.error('Algo deu errado', 'Detalhes do erro')}>
 *         Erro
 *       </button>
 *       <button onClick={() => toast.warning('Cuidado com esta ação')}>
 *         Aviso
 *       </button>
 *       <button onClick={() => toast.info('Nova funcionalidade disponível')}>
 *         Informação
 *       </button>
 *     </div>
 *   );
 * }
 *
 * @example
 * // Integração com mutations/queries
 * function useDeletePost() {
 *   const toast = useToastHelpers();
 *   const queryClient = useQueryClient();
 *
 *   return useMutation({
 *     mutationFn: deletePost,
 *     onSuccess: () => {
 *       toast.success('Post excluído');
 *       queryClient.invalidateQueries(['posts']);
 *     },
 *     onError: () => {
 *       toast.error('Não foi possível excluir', 'Tente novamente');
 *     }
 *   });
 * }
 *
 * @example
 * // Validação de formulário com feedback
 * function LoginForm() {
 *   const toast = useToastHelpers();
 *
 *   const handleLogin = (email, password) => {
 *     if (!email) {
 *       toast.warning('Digite seu e-mail');
 *       return;
 *     }
 *     if (password.length < 6) {
 *       toast.warning('Senha muito curta', 'Use no mínimo 6 caracteres');
 *       return;
 *     }
 *     // Prosseguir com login...
 *   };
 *
 *   return <form>...</form>;
 * }
 *
 * @example
 * // Operações em lote com feedback
 * function BulkActions() {
 *   const toast = useToastHelpers();
 *
 *   const deleteSelected = async (ids) => {
 *     toast.info('Excluindo itens...', `${ids.length} selecionados`);
 *     try {
 *       await api.deleteMany(ids);
 *       toast.success('Itens excluídos', `${ids.length} removidos`);
 *     } catch (error) {
 *       toast.error('Falha na exclusão', 'Alguns itens não foram removidos');
 *     }
 *   };
 *
 *   return <button onClick={() => deleteSelected([1, 2, 3])}>Excluir</button>;
 * }
 */
export function useToastHelpers() {
  const { addToast } = useToast();

  return {
    /**
     * Exibe um toast de sucesso (verde)
     * @param title - Título do toast
     * @param message - Mensagem opcional detalhada
     */
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),

    /**
     * Exibe um toast de erro (vermelho)
     * @param title - Título do toast
     * @param message - Mensagem opcional detalhada
     */
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),

    /**
     * Exibe um toast de aviso (amarelo)
     * @param title - Título do toast
     * @param message - Mensagem opcional detalhada
     */
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),

    /**
     * Exibe um toast informativo (azul)
     * @param title - Título do toast
     * @param message - Mensagem opcional detalhada
     */
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
}
