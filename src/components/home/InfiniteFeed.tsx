'use client';

import { useEffect, useRef, useCallback, memo } from 'react';
import { useInfiniteFeed } from '@/hooks/useInfiniteFeed';
import { InstagramCard } from './InstagramCard';
import { Card, Skeleton, Spinner } from '@/components/ui';
import type { FeedType, FeedSortType } from '@/actions/feed';
import type { PostWithAuthor } from '@/types/post';

interface InfiniteFeedProps {
  type: FeedType;
  sort?: FeedSortType;
  initialPosts?: PostWithAuthor[];
}

// Memoizar o card para evitar re-renders desnecessários
const MemoizedCard = memo(InstagramCard);

// Loading skeleton para posts
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

export function InfiniteFeed({ type, sort = 'new', initialPosts }: InfiniteFeedProps) {
  const {
    posts,
    hasMore,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    prefetchNextPage,
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

  // Estado vazio
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">
          {type === 'creator'
            ? 'Nenhuma novidade do criador ainda.'
            : 'Nenhum post da comunidade ainda.'}
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

      {/* Mensagem de fim do feed */}
      {!hasMore && posts.length > 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          Você chegou ao fim do feed
        </div>
      )}
    </div>
  );
}
