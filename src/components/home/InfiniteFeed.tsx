'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { InstagramCard } from './InstagramCard';
import { Card, Skeleton, Spinner, Button } from '@/components/ui';
import type { FeedType, FeedSortType } from '@/actions/feed';
import type { PostWithAuthor } from '@/types/post';

/**
 * Props do componente InfiniteFeed
 */
interface InfiniteFeedProps {
  /** Tipo de feed: 'creator', 'community', 'all' ou 'help_request' */
  type: FeedType;
  /** Ordenação: 'new', 'top' ou 'hot' (padrão: 'new') */
  sort?: FeedSortType;
  /** Posts iniciais do SSR - evita skeleton no primeiro render */
  initialPosts?: PostWithAuthor[];
}

// Memoizar o card para evitar re-renders desnecessários
const MemoizedCard = memo(InstagramCard);

/**
 * Skeleton de loading para posts
 * Replica a estrutura visual de um post para melhor UX durante loading
 */
function PostSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="aspect-[4/5] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
      </div>
    </Card>
  );
}

/**
 * Componente de feed com infinite scroll automático
 *
 * @description
 * Feed de posts com paginação infinita usando Intersection Observer.
 * Recursos:
 * - Infinite scroll automático (carrega ao chegar no fim)
 * - Prefetch antecipado da próxima página (~70% do scroll)
 * - Skeleton loading (10 posts) no carregamento inicial
 * - Spinner sutil ao carregar mais posts
 * - Animação fade-in suave para novos posts
 * - Tratamento de erro com retry
 * - SSR support com initialPosts
 * - Memoização de cards para performance
 *
 * O componente usa dois Intersection Observers:
 * 1. Prefetch Observer (rootMargin: 800px) - trigger antecipado
 * 2. Fetch Observer (rootMargin: 100px) - carregamento real
 *
 * @param {InfiniteFeedProps} props - Props do componente
 * @returns {JSX.Element} Feed renderizado
 *
 * @example
 * // Uso básico com SSR
 * export default async function HomePage() {
 *   const initialPosts = await getInitialFeedPosts('all', 10);
 *
 *   return (
 *     <InfiniteFeed
 *       type="all"
 *       sort="new"
 *       initialPosts={initialPosts}
 *     />
 *   );
 * }
 *
 * @example
 * // Feed de posts do criador ordenados por curtidas
 * <InfiniteFeed type="creator" sort="top" />
 *
 * @example
 * // Feed de posts trending da comunidade
 * <InfiniteFeed type="community" sort="hot" />
 */
export function InfiniteFeed({ type, sort = 'new', initialPosts }: InfiniteFeedProps) {
  const {
    posts,
    hasMore,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
    prefetchNextPage,
    refetch,
  } = useInfiniteFeed({
    type,
    sort,
    initialData: initialPosts,
  });

  // Ref para o elemento sentinel de prefetch (trigger antecipado)
  const prefetchSentinelRef = useRef<HTMLDivElement>(null);
  // Ref para o elemento sentinel (trigger do infinite scroll)
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Callback para Intersection Observer de prefetch
  const handlePrefetchObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      // Prefetch quando o usuário está se aproximando do fim (~70% do conteúdo visível)
      if (entry.isIntersecting && hasMore && !isFetchingNextPage) {
        prefetchNextPage();
      }
    },
    [hasMore, isFetchingNextPage, prefetchNextPage]
  );

  // Callback para Intersection Observer de fetch real
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasMore, isFetchingNextPage, fetchNextPage]
  );

  // Setup Intersection Observer para prefetch (antecipado)
  useEffect(() => {
    const prefetchSentinel = prefetchSentinelRef.current;
    if (!prefetchSentinel) return;

    const observer = new IntersectionObserver(handlePrefetchObserver, {
      root: null, // viewport
      rootMargin: '800px', // Prefetch quando ainda faltam 800px para chegar ao fim (~70% visível)
      threshold: 0.1,
    });

    observer.observe(prefetchSentinel);

    return () => {
      observer.disconnect();
    };
  }, [handlePrefetchObserver]);

  // Setup Intersection Observer para fetch real
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null, // viewport
      rootMargin: '100px', // Começar a carregar 100px antes de chegar ao fim
      threshold: 0.1,
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleObserver]);

  // Estado de loading inicial - mostra 10 skeletons para melhor feedback
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Estado de erro no carregamento inicial
  if (isError && posts.length === 0) {
    // Log do erro para debugging
    console.error('Erro ao carregar feed:', error);

    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Ops! Algo deu errado
            </p>
            <p className="text-sm text-gray-500">
              Não conseguimos carregar o feed. Por favor, tente novamente.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  // Estado vazio
  if (posts.length === 0) {
    const emptyMessage = {
      creator: 'Nenhuma novidade do criador ainda.',
      community: 'Nenhum post da comunidade ainda.',
      all: 'Nenhum post ainda.',
      help_request: 'Nenhum pedido de ajuda no momento.',
    };

    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">
          {emptyMessage[type]}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de posts com animação de entrada */}
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in"
          style={{
            animationDelay: `${Math.min(index * 50, 500)}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <MemoizedCard post={post} />
        </div>
      ))}

      {/* Sentinel element para prefetch antecipado (invisível, trigger mais cedo) */}
      <div ref={prefetchSentinelRef} className="h-0" aria-hidden="true" />

      {/* Sentinel element para trigger do infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading indicator sutil para próxima página */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Spinner size="md" className="text-primary-600" />
        </div>
      )}

      {/* Erro ao carregar próxima página */}
      {isError && posts.length > 0 && !isFetchingNextPage && (
        <Card className="p-6 text-center">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Erro ao carregar mais posts
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.error('Erro ao carregar próxima página:', error);
                fetchNextPage();
              }}
            >
              Tentar novamente
            </Button>
          </div>
        </Card>
      )}

      {/* Mensagem de fim do feed */}
      {!hasMore && !isError && posts.length > 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          Você chegou ao fim do feed
        </div>
      )}
    </div>
  );
}
