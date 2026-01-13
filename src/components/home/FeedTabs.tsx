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
  initialCommunityPosts?: PostWithAuthor[];
  initialHelpRequestPosts?: PostWithAuthor[];
}

export function FeedTabs({ initialCommunityPosts, initialHelpRequestPosts }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<'comunidade' | 'ajuda'>('comunidade');
  const [sort, setSort] = useState<FeedSortType>('new');
  const queryClient = useQueryClient();

  // Realtime para novos posts
  const feedType = activeTab === 'comunidade' ? 'community' : 'help_request';
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
  const handleTabChange = (tab: 'comunidade' | 'ajuda') => {
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

      {/* Banner de Pedidos de Ajuda */}
      {activeTab === 'ajuda' && (
        <div className="mt-4 mx-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Oportunidade de fazer a diferença</h3>
              <p className="text-sm text-blue-700 mt-1">
                Aqui estão pessoas da comunidade que precisam de ajuda. Cada pequeno gesto pode transformar a vida de alguém.
              </p>
              <p className="text-xs text-blue-600/80 mt-2 italic">
                Dica: Antes de ajudar, converse com a pessoa para entender melhor a situação. A plataforma conecta pessoas, mas não verifica ou se responsabiliza pelos pedidos publicados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed com Infinite Scroll */}
      <div className="mt-4">
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
