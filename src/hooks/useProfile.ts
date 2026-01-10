'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/actions/profile';
import type { UpdateProfileData } from '@/types/profile';

/**
 * Hook customizado para gerenciamento de perfil de usuário
 *
 * Este hook fornece uma interface para atualizar dados do perfil do usuário,
 * gerenciando automaticamente estados de carregamento, erros e atualização da UI.
 * Utiliza React transitions para transições suavês na interface.
 *
 * @returns {Object} Objeto contendo estados e métodos para gerenciar o perfil
 * @returns {boolean} isPending - Indica se há uma operação de atualização em andamento (transição do React)
 * @returns {string | null} error - Mensagem de erro da última operação, ou null se não houver erro
 * @returns {Function} update - Atualiza os dados do perfil do usuário
 *
 * @example
 * ```tsx
 * import { useProfile } from '@/hooks/useProfile';
 *
 * function ProfileForm() {
 *   const { update, isPending, error } = useProfile();
 *
 *   const handleSubmit = async (formData: UpdateProfileData) => {
 *     const result = await update({
 *       name: 'João Silva',
 *       bio: 'Desenvolvedor Full Stack',
 *       avatar_url: 'https://example.com/avatar.jpg'
 *     });
 *
 *     if (result.success) {
 *       console.log('Perfil atualizado com sucesso!');
 *     } else {
 *       console.error('Erro ao atualizar:', result.error);
 *     }
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {isPending && <p>Salvando...</p>}
 *       {error && <p className="error">{error}</p>}
 *       <button type="submit" disabled={isPending}>
 *         Salvar Perfil
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Atualização parcial do perfil
 * const { update, error } = useProfile();
 *
 * // Atualizar apenas o nome
 * await update({ name: 'Maria Santos' });
 *
 * // Atualizar apenas a bio
 * await update({ bio: 'UX/UI Designer' });
 *
 * // Verificar erros após atualização
 * if (error) {
 *   console.error('Falha na atualização:', error);
 * }
 * ```
 */
export function useProfile() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /**
   * Atualiza os dados do perfil do usuário
   *
   * Envia os dados atualizados do perfil para o servidor. Em caso de sucesso,
   * atualiza automaticamente a UI através de router.refresh(). Gerencia estados
   * de erro e carregamento durante a operação.
   *
   * @param {UpdateProfileData} data - Dados do perfil a serem atualizados (name, bio, avatar_url, etc.)
   * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await update({
   *   name: 'João Silva',
   *   bio: 'Desenvolvedor Full Stack',
   *   avatar_url: 'https://example.com/avatar.jpg'
   * });
   *
   * if (result.success) {
   *   console.log('Perfil atualizado!');
   * } else {
   *   console.error('Erro:', result.error);
   * }
   * ```
   */
  const handleUpdate = useCallback(async (data: UpdateProfileData) => {
    setError(null);
    const result = await updateProfile(data);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  return {
    isPending,
    error,
    update: handleUpdate,
  };
}
