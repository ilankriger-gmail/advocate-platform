'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeedPosts, type FeedType, type FeedSortType } from '@/actions/feed';
import type { PostWithAuthor, PaginatedFeedResponse } from '@/types/post';

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

  return {
    posts,
    hasMore,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * Hook para invalidar o cache do feed
 * Útil após criar/deletar posts
 */
export { useQueryClient } from '@tanstack/react-query';
