'use client';

import { useState } from 'react';
import { InfiniteFeed } from './InfiniteFeed';
import { SortSelector } from './SortSelector';
import type { FeedSortType } from '@/actions/feed';
import type { PostWithAuthor } from '@/types/post';

interface FeedTabsProps {
  initialCreatorPosts?: PostWithAuthor[];
  initialCommunityPosts?: PostWithAuthor[];
}

export function FeedTabs({ initialCreatorPosts, initialCommunityPosts }: FeedTabsProps) {
  const [activeTab, setActiveTab] = useState<'novidades' | 'comunidade'>('novidades');
  const [sort, setSort] = useState<FeedSortType>('new');

  return (
    <div>
      {/* Tabs + Sort Selector */}
      <div className="sticky top-0 bg-white z-10 pb-2">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('novidades')}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
              activeTab === 'novidades'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Novidades
          </button>
          <button
            onClick={() => setActiveTab('comunidade')}
            className={`flex-1 py-3 text-center font-semibold text-sm transition-colors ${
              activeTab === 'comunidade'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Comunidade
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex justify-center mt-3">
          <SortSelector value={sort} onChange={setSort} />
        </div>
      </div>

      {/* Feed com Infinite Scroll */}
      <div className="mt-4">
        {activeTab === 'novidades' ? (
          <InfiniteFeed
            key={`creator-${sort}`}
            type="creator"
            sort={sort}
            initialPosts={sort === 'new' ? initialCreatorPosts : undefined}
          />
        ) : (
          <InfiniteFeed
            key={`community-${sort}`}
            type="community"
            sort={sort}
            initialPosts={sort === 'new' ? initialCommunityPosts : undefined}
          />
        )}
      </div>
    </div>
  );
}
