/**
 * @module hooks
 *
 * Módulo de hooks React customizados da aplicação
 *
 * Este módulo centraliza todos os hooks customizados reutilizáveis da aplicação,
 * fornecendo interfaces consistentes para operações comuns como gerenciamento de
 * notificações, posts e perfis de usuário.
 *
 * ## Hooks disponíveis
 *
 * ### useToast
 * Hook para gerenciamento de notificações toast (success, error, warning, info).
 * Fornece métodos para exibir mensagens temporárias ao usuário com diferentes
 * níveis de severidade e controle de duração.
 *
 * ### usePosts
 * Hook para gerenciamento completo de posts, incluindo operações CRUD (criar,
 * aprovar, rejeitar, excluir), além de funcionalidades de interação como curtidas
 * e comentários. Gerencia automaticamente estados de carregamento e erros.
 *
 * ### useProfile
 * Hook para gerenciamento de perfil de usuário, fornecendo métodos para atualização
 * de dados do perfil com controle de estados de carregamento e tratamento de erros.
 *
 * ## Tipos exportados
 *
 * - **Toast**: Interface que representa uma notificação toast
 * - **ToastType**: Tipo literal para os tipos de notificação ('success' | 'error' | 'warning' | 'info')
 *
 * @example
 * ```tsx
 * // Importando hooks individuais
 * import { useToast, usePosts, useProfile } from '@/hooks';
 *
 * function MyComponent() {
 *   const { success, error } = useToast();
 *   const { create, isPending } = usePosts();
 *   const { update } = useProfile();
 *
 *   // usar os hooks...
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Importando tipos
 * import { type Toast, type ToastType } from '@/hooks';
 *
 * const customToast: Toast = {
 *   id: '123',
 *   message: 'Operação concluída',
 *   type: 'success',
 *   duration: 5000
 * };
 * ```
 */

export { useToast, type Toast, type ToastType } from './useToast';
export { usePosts } from './usePosts';
export { useProfile } from './useProfile';
export { useEvents } from './useEvents';
