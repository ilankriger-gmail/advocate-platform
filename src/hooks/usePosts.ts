'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createPost,
  approvePost,
  rejectPost,
  likePost,
  commentPost,
  deletePost,
} from '@/actions/posts';
import type { CreatePostData } from '@/types/post';

/**
 * Hook customizado para gerenciamento de posts
 *
 * Este hook fornece uma interface completa para realizar operações CRUD em posts,
 * incluindo criação, aprovação, rejeição, curtidas, comentários e exclusão.
 * Gerencia automaticamente estados de carregamento, erros e atualização da UI.
 *
 * @returns {Object} Objeto contendo estados e métodos para gerenciar posts
 * @returns {boolean} isPending - Indica se há uma operação em andamento (transição do React)
 * @returns {string | null} error - Mensagem de erro da última operação, ou null se não houver erro
 * @returns {Function} create - Cria um novo post
 * @returns {Function} approve - Aprova um post pendente
 * @returns {Function} reject - Rejeita um post com motivo
 * @returns {Function} like - Adiciona/remove curtida em um post
 * @returns {Function} comment - Adiciona um comentário em um post
 * @returns {Function} delete - Exclui um post
 *
 * @example
 * ```tsx
 * import { usePosts } from '@/hooks/usePosts';
 *
 * function PostManager() {
 *   const { create, approve, reject, isPending, error } = usePosts();
 *
 *   const handleCreatePost = async () => {
 *     const result = await create({
 *       title: 'Meu Post',
 *       content: 'Conteúdo do post',
 *       image_url: 'https://example.com/image.jpg'
 *     });
 *
 *     if (result.success) {
 *       console.log('Post criado:', result.data);
 *     }
 *   };
 *
 *   const handleApprovePost = async (postId: string) => {
 *     const result = await approve(postId);
 *     if (result.success) {
 *       console.log('Post aprovado!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {isPending && <p>Carregando...</p>}
 *       {error && <p>Erro: {error}</p>}
 *       <button onClick={handleCreatePost}>Criar Post</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Gerenciamento completo de posts
 * const { like, comment, delete: deletePost, error } = usePosts();
 *
 * // Curtir um post
 * await like('post-123');
 *
 * // Adicionar comentário
 * const result = await comment('post-123', 'Ótimo conteúdo!');
 * if (result.success) {
 *   console.log('Comentário adicionado:', result.data);
 * }
 *
 * // Excluir post
 * await deletePost('post-123');
 * ```
 */
export function usePosts() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /**
   * Cria um novo post
   *
   * Envia os dados do post para criação no servidor. Em caso de sucesso,
   * atualiza automaticamente a UI. Gerencia estados de erro e carregamento.
   *
   * @param {CreatePostData} data - Dados do post a ser criado (title, content, image_url, etc.)
   * @returns {Promise<{success: boolean, error?: string, data?: any}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await create({
   *   title: 'Novo Post',
   *   content: 'Conteúdo do post',
   *   image_url: 'https://example.com/image.jpg'
   * });
   *
   * if (result.success) {
   *   console.log('Post criado:', result.data);
   * } else {
   *   console.error('Erro:', result.error);
   * }
   * ```
   */
  const handleCreate = useCallback(async (data: CreatePostData) => {
    setError(null);
    const result = await createPost(data);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    // Retornar informações completas de moderação para o componente usar Toast
    return {
      success: true,
      data: result.data,
      message: result.message,
      moderationStatus: result.moderationStatus,
      contentCategory: result.contentCategory,
      blockedReasons: result.blockedReasons,
    };
  }, [router]);

  /**
   * Aprova um post pendente
   *
   * Marca um post como aprovado, permitindo sua publicação. Apenas usuários
   * com permissão adequada podem aprovar posts. Atualiza a UI automaticamente.
   *
   * @param {string} postId - ID do post a ser aprovado
   * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await approve('post-123');
   *
   * if (result.success) {
   *   console.log('Post aprovado com sucesso!');
   * } else {
   *   console.error('Erro ao aprovar:', result.error);
   * }
   * ```
   */
  const handleApprove = useCallback(async (postId: string) => {
    setError(null);
    const result = await approvePost(postId);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  /**
   * Rejeita um post com motivo
   *
   * Marca um post como rejeitado, impedindo sua publicação. Requer um motivo
   * de rejeição que será armazenado para referência. Apenas usuários com
   * permissão adequada podem rejeitar posts.
   *
   * @param {string} postId - ID do post a ser rejeitado
   * @param {string} reason - Motivo da rejeição (obrigatório)
   * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await reject('post-123', 'Conteúdo inadequado para a plataforma');
   *
   * if (result.success) {
   *   console.log('Post rejeitado');
   * } else {
   *   console.error('Erro ao rejeitar:', result.error);
   * }
   * ```
   */
  const handleReject = useCallback(async (postId: string, reason: string) => {
    setError(null);
    const result = await rejectPost(postId, reason);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  /**
   * Adiciona ou remove curtida em um post
   *
   * Alterna o estado de curtida do usuário no post. Se o usuário já curtiu,
   * remove a curtida. Se não curtiu, adiciona a curtida. Atualiza o contador
   * de curtidas e a UI automaticamente.
   *
   * @param {string} postId - ID do post a ser curtido/descurtido
   * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await like('post-123');
   *
   * if (result.success) {
   *   console.log('Curtida atualizada');
   * } else {
   *   console.error('Erro ao curtir:', result.error);
   * }
   * ```
   */
  const handleLike = useCallback(async (postId: string) => {
    setError(null);
    const result = await likePost(postId);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true };
  }, [router]);

  /**
   * Adiciona um comentário em um post
   *
   * Cria um novo comentário associado ao post especificado. O comentário
   * será vinculado ao usuário atual. Atualiza a lista de comentários
   * e a UI automaticamente.
   *
   * @param {string} postId - ID do post onde adicionar o comentário
   * @param {string} content - Conteúdo do comentário (texto)
   * @returns {Promise<{success: boolean, error?: string, data?: any}>} Resultado da operação com dados do comentário criado
   *
   * @example
   * ```tsx
   * const result = await comment('post-123', 'Excelente conteúdo!');
   *
   * if (result.success) {
   *   console.log('Comentário adicionado:', result.data);
   * } else {
   *   console.error('Erro ao comentar:', result.error);
   * }
   * ```
   */
  const handleComment = useCallback(async (postId: string, content: string) => {
    setError(null);
    const result = await commentPost(postId, content);

    if (result.error) {
      setError(result.error);
      return { success: false, error: result.error };
    }

    startTransition(() => {
      router.refresh();
    });

    return { success: true, data: result.data };
  }, [router]);

  /**
   * Exclui um post
   *
   * Remove permanentemente um post do sistema. Esta ação não pode ser desfeita.
   * Apenas o autor do post ou usuários com permissão de administrador podem
   * excluir posts. Atualiza a UI automaticamente removendo o post da listagem.
   *
   * @param {string} postId - ID do post a ser excluído
   * @returns {Promise<{success: boolean, error?: string}>} Resultado da operação
   *
   * @example
   * ```tsx
   * const result = await delete('post-123');
   *
   * if (result.success) {
   *   console.log('Post excluído com sucesso');
   * } else {
   *   console.error('Erro ao excluir:', result.error);
   * }
   * ```
   */
  const handleDelete = useCallback(async (postId: string) => {
    setError(null);
    const result = await deletePost(postId);

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
    create: handleCreate,
    approve: handleApprove,
    reject: handleReject,
    like: handleLike,
    comment: handleComment,
    delete: handleDelete,
  };
}
