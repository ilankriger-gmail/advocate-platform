'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getFeedPosts, type FeedType, type FeedSortType } from '@/actions/feed';
import type { PostWithAuthor, PaginatedFeedResponse } from '@/types/post';
import { useCallback } from 'react';

/**
 * Opções para o hook useInfiniteFeed
 */
interface UseInfiniteFeedOptions {
  /** Tipo de feed: 'creator' (posts do criador), 'community' (posts da comunidade) ou 'all' (todos) */
  type: FeedType;
  /** Ordenação: 'new' (mais recentes), 'top' (mais curtidos) ou 'hot' (trending) */
  sort?: FeedSortType;
  /** Posts iniciais do SSR - evita loading state no primeiro render */
  initialData?: PostWithAuthor[];
  /** Número de posts por página (padrão: 10) */
  limit?: number;
}

/**
 * Hook para infinite scroll do feed com React Query
 *
 * @description
 * Implementa infinite scroll pattern usando React Query para gerenciamento de estado.
 * Recursos:
 * - Cache automático de páginas carregadas
 * - Deduplicação de requests
 * - Refetch automático em window focus
 * - Prefetch da próxima página para performance
 * - SSR support com initialData
 * - Loading e error states gerenciados
 *
 * Quando type ou sort mudam, o React Query automaticamente invalida e recarrega o feed.
 * Os posts são automaticamente flattened de todas as páginas carregadas.
 *
 * @param {UseInfiniteFeedOptions} options - Configurações do feed
 * @returns {Object} Estado e métodos do infinite feed
 * @returns {PostWithAuthor[]} posts - Array de posts de todas as páginas
 * @returns {boolean} hasMore - Indica se há mais posts para carregar
 * @returns {boolean} isLoading - Loading do primeiro carregamento
 * @returns {boolean} isFetchingNextPage - Loading ao carregar próxima página
 * @returns {boolean} isError - Indica se houve erro
 * @returns {Error} error - Objeto de erro (se houver)
 * @returns {Function} fetchNextPage - Função para carregar próxima página
 * @returns {Function} prefetchNextPage - Função para prefetch da próxima página
 * @returns {Function} refetch - Função para recarregar todo o feed
 *
 * @example
 * // Uso básico - feed de posts do criador
 * function CreatorFeed() {
 *   const { posts, hasMore, isLoading, fetchNextPage } = useInfiniteFeed({
 *     type: 'creator',
 *     sort: 'new',
 *   });
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return (
 *     <div>
 *       {posts.map(post => <PostCard key={post.id} post={post} />)}
 *       {hasMore && <button onClick={() => fetchNextPage()}>Carregar mais</button>}
 *     </div>
 *   );
 * }
 *
 * @example
 * // Com SSR - evita loading state inicial
 * function HomePage({ initialPosts }: { initialPosts: PostWithAuthor[] }) {
 *   const { posts, hasMore, fetchNextPage } = useInfiniteFeed({
 *     type: 'all',
 *     sort: 'new',
 *     initialData: initialPosts, // Posts do servidor
 *   });
 *
 *   // Primeiro render já mostra posts, sem loading
 *   return <InfiniteFeed posts={posts} hasMore={hasMore} />;
 * }
 *
 * @example
 * // Com Intersection Observer para infinite scroll automático
 * function AutoInfiniteFeed() {
 *   const {
 *     posts,
 *     hasMore,
 *     isFetchingNextPage,
 *     fetchNextPage,
 *     prefetchNextPage
 *   } = useInfiniteFeed({ type: 'community', sort: 'hot' });
 *
 *   const sentinelRef = useRef<HTMLDivElement>(null);
 *
 *   useEffect(() => {
 *     const sentinel = sentinelRef.current;
 *     if (!sentinel) return;
 *
 *     const observer = new IntersectionObserver((entries) => {
 *       if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
 *         fetchNextPage();
 *       }
 *     });
 *
 *     observer.observe(sentinel);
 *     return () => observer.disconnect();
 *   }, [hasMore, isFetchingNextPage, fetchNextPage]);
 *
 *   return (
 *     <>
 *       {posts.map(post => <PostCard key={post.id} post={post} />)}
 *       <div ref={sentinelRef} />
 *       {isFetchingNextPage && <Spinner />}
 *     </>
 *   );
 * }
 *
 * @example
 * // Tratamento de erro com retry
 * function FeedWithErrorHandling() {
 *   const { posts, isError, error, refetch } = useInfiniteFeed({
 *     type: 'all',
 *   });
 *
 *   if (isError) {
 *     return (
 *       <div>
 *         <p>Erro: {error?.message}</p>
 *         <button onClick={() => refetch()}>Tentar novamente</button>
 *       </div>
 *     );
 *   }
 *
 *   return <PostList posts={posts} />;
 * }
 */
export function useInfiniteFeed({
  type,
  sort = 'new',
  initialData,
  limit = 10,
}: UseInfiniteFeedOptions) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<PaginatedFeedResponse<PostWithAuthor>>({
    queryKey: ['feed', type, sort],
    queryFn: async ({ pageParam }) => {
      return getFeedPosts({
        type,
        sort,
        cursor: pageParam as string | undefined,
        limit,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    // Se temos dados iniciais do servidor, usar como primeira página
    initialData: initialData
      ? {
          pages: [
            {
              data: initialData,
              nextCursor: initialData.length === limit ? initialData[initialData.length - 1].created_at : null,
              hasMore: initialData.length === limit,
            },
          ],
          pageParams: [undefined],
        }
      : undefined,
  });

  // Flatten posts de todas as páginas
  const posts = query.data?.pages.flatMap((page) => page.data) ?? [];

  // Verificar se tem mais posts
  const hasMore = query.data?.pages[query.data.pages.length - 1]?.hasMore ?? false;

  /**
   * Prefetch da próxima página para melhorar performance percebida
   *
   * @description
   * Carrega a próxima página em background antes do usuário chegar ao fim do scroll.
   * O React Query gerencia o cache automaticamente:
   * - Não faz request duplicado se a página já está em cache
   * - Não faz request se já está carregando
   * - Cache compartilhado com fetchNextPage (zero custo quando usuário chega ao fim)
   *
   * Ideal para uso com Intersection Observer com trigger antecipado (ex: rootMargin: '800px').
   *
   * @example
   * // Prefetch quando usuário está 70% do fim da página
   * useEffect(() => {
   *   const observer = new IntersectionObserver(
   *     (entries) => {
   *       if (entries[0].isIntersecting) {
   *         prefetchNextPage(); // Carrega em background
   *       }
   *     },
   *     { rootMargin: '800px' } // Trigger antecipado
   *   );
   *   observer.observe(prefetchSentinel);
   * }, [prefetchNextPage]);
   */
  const prefetchNextPage = useCallback(async () => {
    // Não prefetch se não há mais páginas ou já está carregando
    if (!hasMore || query.isFetchingNextPage) {
      return;
    }

    // Obter o cursor da última página
    const lastPage = query.data?.pages[query.data.pages.length - 1];
    const nextCursor = lastPage?.nextCursor;

    // Só prefetch se temos um cursor válido
    if (!nextCursor) {
      return;
    }

    // Prefetch usando React Query - automaticamente deduplica e usa cache
    await queryClient.prefetchInfiniteQuery({
      queryKey: ['feed', type, sort],
      queryFn: async ({ pageParam }) => {
        return getFeedPosts({
          type,
          sort,
          cursor: pageParam as string | undefined,
          limit,
        });
      },
      initialPageParam: nextCursor,
      pages: 1, // Apenas prefetch da próxima página
    });
  }, [hasMore, query.isFetchingNextPage, query.data?.pages, type, sort, limit, queryClient]);

  return {
    posts,
    hasMore,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    prefetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * Hook para acessar o QueryClient e invalidar caches
 *
 * @description
 * Exportado do React Query para permitir invalidação manual do cache do feed.
 * Útil após mutações que afetam a lista de posts (criar, deletar, atualizar).
 *
 * @example
 * // Invalidar cache após criar um post
 * import { useQueryClient } from '@/hooks/useInfiniteFeed';
 *
 * function CreatePostButton() {
 *   const queryClient = useQueryClient();
 *
 *   const handleCreatePost = async () => {
 *     await createPost({ ... });
 *     // Invalida o cache para recarregar o feed
 *     queryClient.invalidateQueries({ queryKey: ['feed'] });
 *   };
 *
 *   return <button onClick={handleCreatePost}>Criar Post</button>;
 * }
 */
export { useQueryClient } from '@tanstack/react-query';
