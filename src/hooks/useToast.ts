'use client';

import { useState, useCallback } from 'react';

/**
 * Tipo de notificação toast
 *
 * Valores possíveis:
 * - 'success': Notificação de sucesso (verde)
 * - 'error': Notificação de erro (vermelho)
 * - 'warning': Notificação de aviso (amarelo)
 * - 'info': Notificação informativa (azul)
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface que representa uma notificação toast
 *
 * @property {string} id - Identificador único da notificação
 * @property {string} message - Mensagem a ser exibida
 * @property {ToastType} type - Tipo da notificação (success, error, warning, info)
 * @property {number} [duration] - Duração em milissegundos antes de auto-fechar (opcional, padrão: 5000ms)
 */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

/**
 * Hook customizado para gerenciamento de notificações toast
 *
 * Este hook fornece uma interface completa para exibir notificações temporárias
 * na aplicação. Suporta diferentes tipos de mensagens (sucesso, erro, aviso, info)
 * e auto-fechamento configurável.
 *
 * @returns {Object} Objeto contendo o estado e métodos do toast
 * @returns {Toast[]} toasts - Array de notificações ativas
 * @returns {Function} addToast - Adiciona uma nova notificação
 * @returns {Function} removeToast - Remove uma notificação por ID
 * @returns {Function} success - Atalho para notificação de sucesso
 * @returns {Function} error - Atalho para notificação de erro
 * @returns {Function} warning - Atalho para notificação de aviso
 * @returns {Function} info - Atalho para notificação informativa
 *
 * @example
 * ```tsx
 * import { useToast } from '@/hooks/useToast';
 *
 * function MyComponent() {
 *   const { success, error, warning, info, removeToast } = useToast();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       success('Dados salvos com sucesso!');
 *     } catch (err) {
 *       error('Erro ao salvar dados', 10000); // duração de 10 segundos
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Salvar</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Uso avançado com controle manual
 * const { addToast, removeToast } = useToast();
 *
 * const toastId = addToast('Processando...', 'info', 0); // não auto-fecha
 * // ... realizar operação
 * removeToast(toastId); // remover manualmente
 * ```
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Adiciona uma nova notificação toast
   *
   * @param {string} message - Mensagem a ser exibida na notificação
   * @param {ToastType} [type='info'] - Tipo da notificação (success, error, warning, info)
   * @param {number} [duration=5000] - Duração em milissegundos antes de auto-fechar (0 = não fecha automaticamente)
   * @returns {string} ID único da notificação criada
   *
   * @example
   * ```tsx
   * const toastId = addToast('Operação concluída', 'success', 3000);
   * ```
   */
  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Remove uma notificação toast específica
   *
   * @param {string} id - ID da notificação a ser removida
   *
   * @example
   * ```tsx
   * removeToast('abc1234');
   * ```
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Exibe uma notificação de sucesso
   *
   * Atalho para addToast com type='success'. Ideal para confirmar
   * operações bem-sucedidas como salvamentos, criações, etc.
   *
   * @param {string} message - Mensagem de sucesso a ser exibida
   * @param {number} [duration=5000] - Duração em milissegundos antes de auto-fechar
   * @returns {string} ID único da notificação criada
   *
   * @example
   * ```tsx
   * success('Perfil atualizado com sucesso!');
   * success('Post publicado!', 3000);
   * ```
   */
  const success = useCallback((message: string, duration?: number) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  /**
   * Exibe uma notificação de erro
   *
   * Atalho para addToast com type='error'. Ideal para exibir
   * mensagens de erro, falhas em operações, validações, etc.
   *
   * @param {string} message - Mensagem de erro a ser exibida
   * @param {number} [duration=5000] - Duração em milissegundos antes de auto-fechar
   * @returns {string} ID único da notificação criada
   *
   * @example
   * ```tsx
   * error('Falha ao carregar dados');
   * error('Erro de autenticação', 8000);
   * ```
   */
  const error = useCallback((message: string, duration?: number) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  /**
   * Exibe uma notificação de aviso
   *
   * Atalho para addToast com type='warning'. Ideal para alertas,
   * avisos de validação não-críticos ou situações que requerem atenção.
   *
   * @param {string} message - Mensagem de aviso a ser exibida
   * @param {number} [duration=5000] - Duração em milissegundos antes de auto-fechar
   * @returns {string} ID único da notificação criada
   *
   * @example
   * ```tsx
   * warning('Alguns campos estão vazios');
   * warning('Esta ação não pode ser desfeita', 7000);
   * ```
   */
  const warning = useCallback((message: string, duration?: number) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  /**
   * Exibe uma notificação informativa
   *
   * Atalho para addToast com type='info'. Ideal para mensagens
   * neutras, dicas, instruções ou feedback geral ao usuário.
   *
   * @param {string} message - Mensagem informativa a ser exibida
   * @param {number} [duration=5000] - Duração em milissegundos antes de auto-fechar
   * @returns {string} ID único da notificação criada
   *
   * @example
   * ```tsx
   * info('Carregando dados...');
   * info('Bem-vindo ao sistema!', 4000);
   * ```
   */
  const info = useCallback((message: string, duration?: number) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
}
