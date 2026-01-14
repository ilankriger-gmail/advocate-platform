'use client';

import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { searchAll, type SearchResults, type SearchType } from '@/actions/search';
import type { PostWithAuthor } from '@/types/post';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';

// Tipos para o conteúdo inicial
interface DiscoverContent {
  trendingPosts: PostWithAuthor[];
  activeChallenges: any[];
  availableRewards: any[];
  upcomingEvents: any[];
  topUsers: any[];
}

interface DiscoverClientProps {
  initialContent: DiscoverContent;
}

// Tabs disponíveis
const TABS: { id: SearchType; label: string; icon: React.ReactNode }[] = [
  {
    id: 'all',
    label: 'Todos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'posts',
    label: 'Posts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'challenges',
    label: 'Desafios',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'rewards',
    label: 'Prêmios',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Usuários',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export function DiscoverClient({ initialContent }: DiscoverClientProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchType>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isPending, startTransition] = useTransition();

  // Debounced search
  const handleSearch = useCallback(
    (searchQuery: string, searchType: SearchType) => {
      if (searchQuery.trim().length < 2) {
        setResults(null);
        return;
      }

      startTransition(async () => {
        const searchResults = await searchAll(searchQuery, searchType);
        setResults(searchResults);
      });
    },
    []
  );

  // Handle query change with debounce
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      handleSearch(newQuery, activeTab);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle tab change
  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab);
    if (query.trim().length >= 2) {
      handleSearch(query, tab);
    }
  };

  // Mostrar resultados de busca ou conteúdo inicial
  const isSearching = query.trim().length >= 2;
  const hasResults = results && (
    results.posts.length > 0 ||
    results.challenges.length > 0 ||
    results.rewards.length > 0 ||
    results.events.length > 0 ||
    results.users.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="sticky top-14 z-20 bg-gray-50 pb-4 -mx-4 px-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar posts, desafios, prêmios, usuários..."
            value={query}
            onChange={handleQueryChange}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Tabs de filtro */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados de busca ou conteúdo inicial */}
      {isSearching ? (
        <SearchResultsView
          results={results}
          activeTab={activeTab}
          isPending={isPending}
          hasResults={hasResults}
          query={query}
        />
      ) : (
        <DiscoverContentView content={initialContent} activeTab={activeTab} />
      )}
    </div>
  );
}

// Componente para exibir resultados de busca
function SearchResultsView({
  results,
  activeTab,
  isPending,
  hasResults,
  query,
}: {
  results: SearchResults | null;
  activeTab: SearchType;
  isPending: boolean;
  hasResults: boolean | null;
  query: string;
}) {
  if (isPending) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Buscando...</p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Nenhum resultado encontrado</p>
        <p className="text-gray-400 text-sm mt-1">Tente buscar por outros termos</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Posts */}
      {(activeTab === 'all' || activeTab === 'posts') && results?.posts && results.posts.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Posts</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Desafios */}
      {(activeTab === 'all' || activeTab === 'challenges') && results?.challenges && results.challenges.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Desafios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      )}

      {/* Prêmios */}
      {(activeTab === 'all' || activeTab === 'rewards') && results?.rewards && results.rewards.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Prêmios</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {results.rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </section>
      )}

      {/* Eventos */}
      {(activeTab === 'all' || activeTab === 'events') && results?.events && results.events.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Eventos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {results.events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Usuários */}
      {(activeTab === 'all' || activeTab === 'users') && results?.users && results.users.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Usuários</h2>
          <div className="space-y-2">
            {results.users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Componente para exibir conteúdo de descoberta
function DiscoverContentView({ content, activeTab }: { content: DiscoverContent; activeTab: SearchType }) {
  return (
    <div className="space-y-8">
      {/* Posts em alta */}
      {(activeTab === 'all' || activeTab === 'posts') && content.trendingPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🔥</span> Em Alta
            </h2>
            <Link href="/" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {content.trendingPosts.slice(0, 6).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Desafios ativos */}
      {(activeTab === 'all' || activeTab === 'challenges') && content.activeChallenges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🎯</span> Desafios Ativos
            </h2>
            <Link href="/desafios" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.activeChallenges.slice(0, 4).map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
      )}

      {/* Prêmios disponíveis */}
      {(activeTab === 'all' || activeTab === 'rewards') && content.availableRewards.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🎁</span> Prêmios Disponíveis
            </h2>
            <Link href="/premios" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {content.availableRewards.slice(0, 6).map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </section>
      )}

      {/* Próximos eventos */}
      {(activeTab === 'all' || activeTab === 'events') && content.upcomingEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📅</span> Próximos Eventos
            </h2>
            <Link href="/eventos" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              Ver tudo
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.upcomingEvents.slice(0, 4).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Ranking preview */}
      {(activeTab === 'all' || activeTab === 'users') && content.topUsers.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🏆</span> Top Fãs
            </h2>
            <Link href="/ranking" className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              Ver ranking
            </Link>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {content.topUsers.slice(0, 5).map((item, index) => (
              <div key={item.user?.id || index} className="flex items-center gap-3 p-3">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold',
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                )}>
                  {index + 1}
                </span>
                <Avatar
                  name={item.user?.full_name || 'Usuário'}
                  src={item.user?.avatar_url}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.user?.full_name || 'Usuário'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-pink-500">
                  {item.balance?.toLocaleString()} ❤️
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Card de post compacto (estilo Instagram grid)
function PostCard({ post }: { post: PostWithAuthor }) {
  const firstMediaUrl = post.media_url?.[0];
  const hasMedia = firstMediaUrl || post.youtube_url || post.instagram_url;

  return (
    <Link
      href={`/post/${post.id}`}
      className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-pink-300 transition-colors relative group"
    >
      {hasMedia && firstMediaUrl ? (
        <Image
          src={firstMediaUrl}
          alt={post.title || 'Post'}
          fill
          className="object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 bg-gradient-to-br from-pink-50 to-purple-50">
          <p className="text-sm text-gray-600 line-clamp-4 text-center">
            {post.content?.substring(0, 100)}
          </p>
        </div>
      )}
      {/* Overlay com info */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
        <span className="flex items-center gap-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {post.likes_count || 0}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.comments_count || 0}
        </span>
      </div>
    </Link>
  );
}

// Card de desafio
function ChallengeCard({ challenge }: { challenge: any }) {
  return (
    <Link
      href={`/desafios/${challenge.id}`}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-pink-300 transition-colors flex items-start gap-3"
    >
      {challenge.thumbnail_url ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 relative">
          <Image
            src={challenge.thumbnail_url}
            alt={challenge.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-2xl shrink-0">
          {challenge.icon || '🎯'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{challenge.title}</h3>
        {challenge.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{challenge.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">
            +{challenge.coins_reward} ❤️
          </span>
          {challenge.ends_at && (
            <span className="text-xs text-gray-400">
              até {new Date(challenge.ends_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Card de prêmio
function RewardCard({ reward }: { reward: any }) {
  return (
    <Link
      href={`/premios/${reward.id}`}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-pink-300 transition-colors"
    >
      <div className="aspect-square relative bg-gray-100">
        {reward.image_url ? (
          <Image
            src={reward.image_url}
            alt={reward.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🎁
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate text-sm">{reward.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-semibold text-pink-500">
            {reward.coins_required} ❤️
          </span>
          <span className="text-xs text-gray-400">
            {reward.quantity_available} disp.
          </span>
        </div>
      </div>
    </Link>
  );
}

// Card de evento
function EventCard({ event }: { event: any }) {
  const eventDate = new Date(event.event_date);

  return (
    <Link
      href={`/eventos/${event.id}`}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-pink-300 transition-colors flex"
    >
      <div className="w-20 sm:w-24 shrink-0 bg-pink-500 text-white flex flex-col items-center justify-center p-2">
        <span className="text-2xl font-bold">{eventDate.getDate()}</span>
        <span className="text-xs uppercase">
          {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
        </span>
      </div>
      <div className="p-3 flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        {event.location && (
          <p className="text-sm text-gray-500 truncate flex items-center gap-1 mt-1">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </p>
        )}
      </div>
    </Link>
  );
}

// Card de usuário
function UserCard({ user }: { user: any }) {
  return (
    <Link
      href={`/perfil/${user.id}`}
      className="bg-white rounded-xl border border-gray-200 p-3 hover:border-pink-300 transition-colors flex items-center gap-3"
    >
      <Avatar
        name={user.full_name || 'Usuário'}
        src={user.avatar_url}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 truncate">{user.full_name || 'Usuário'}</h3>
          {user.is_creator && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
              Criador
            </span>
          )}
        </div>
        {user.bio && (
          <p className="text-sm text-gray-500 truncate mt-0.5">{user.bio}</p>
        )}
      </div>
    </Link>
  );
}
