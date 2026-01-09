'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getFeedPosts, type FeedType, type FeedSortType } from '@/actions/feed';
import type { PostWithAuthor, PaginatedFeedResponse } from '@/types/post';
import { useCallback } from 'react';

interface UseInfiniteFeedOptions {
  type: FeedType;
  sort?: FeedSortType;
  initialData?: PostWithAuthor[];
  limit?: number;
}

/**
 * Hook para infinite scroll do feed
 * Usa React Query para cache, paginação e refetch automático
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
   * Prefetch da próxima página para melhorar performance
   * Usa React Query cache - não faz request duplicado se já está em cache ou loading
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
 * Hook para invalidar o cache do feed
 * Útil após criar/deletar posts
 */
export { useQueryClient } from '@tanstack/react-query';
