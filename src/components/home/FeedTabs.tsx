'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InfiniteFeed } from './InfiniteFeed';
import { SortSelector } from './SortSelector';
import { NewPostsIndicator } from './NewPostsIndicator';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import type { FeedSortType } from '@/actions/feed';
import type { PostWithAuthor } from '@/types/post';

interface FeedTabsProps {
  initialCreatorPosts?: PostWithAuthor[];
  initialCommunityPosts?: PostWithAuthor[];
  initialHelpRequestPosts?: PostWithAuthor[];
}

export function FeedTabs({ initialCreatorPosts, initialCommunityPosts, initialHelpRequestPosts }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<'novidades' | 'comunidade' | 'ajuda'>('novidades');
  const [sort, setSort] = useState<FeedSortType>('new');
  const queryClient = useQueryClient();

  // Realtime para novos posts
  const feedType = activeTab === 'novidades'
    ? 'creator'
    : activeTab === 'comunidade'
      ? 'community'
      : 'help_request';
  const { newPostsCount, resetCount } = useRealtimeFeed({
    type: feedType,
    enabled: sort === 'new', // Só mostrar indicador na ordenação "Novos"
  });

  // Handler para quando clicar no indicador de novos posts
  const handleNewPostsClick = useCallback(() => {
    // Invalidar cache e refetch
    queryClient.invalidateQueries({ queryKey: ['feed', feedType, sort] });
    resetCount();

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [queryClient, feedType, sort, resetCount]);

  // Handler para trocar de tab
  const handleTabChange = (tab: 'novidades' | 'comunidade' | 'ajuda') => {
    setActiveTab(tab);
    resetCount(); // Resetar contador ao trocar de tab
  };

  return (
    <div>
      {/* Indicador de novos posts */}
      <NewPostsIndicator count={newPostsCount} onClick={handleNewPostsClick} />

      {/* Tabs + Sort Selector */}
      <div className="sticky top-0 bg-white z-10 pb-2">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('novidades')}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
              activeTab === 'novidades'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Novidades
          </button>
          <button
            onClick={() => handleTabChange('comunidade')}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
              activeTab === 'comunidade'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Comunidade
          </button>
          <button
            onClick={() => handleTabChange('ajuda')}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
              activeTab === 'ajuda'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pedidos de Ajuda
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex justify-center mt-3">
          <SortSelector value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Feed com Infinite Scroll */}
      <div className="mt-4">
        {activeTab === 'novidades' && (
          <InfiniteFeed
            key={`creator-${sort}`}
            type="creator"
            sort={sort}
            initialPosts={sort === 'new' ? initialCreatorPosts : undefined}
          />
        )}
        {activeTab === 'comunidade' && (
          <InfiniteFeed
            key={`community-${sort}`}
            type="community"
            sort={sort}
            initialPosts={sort === 'new' ? initialCommunityPosts : undefined}
          />
        )}
        {activeTab === 'ajuda' && (
          <InfiniteFeed
            key={`help_request-${sort}`}
            type="help_request"
            sort={sort}
            initialPosts={sort === 'new' ? initialHelpRequestPosts : undefined}
          />
        )}
      </div>
    </div>
  );
}
