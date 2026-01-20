import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard from '@/components/PostCard';
import { feedApi } from '@/lib/api';

type FilterType = 'all' | 'creator' | 'community';
type SortType = 'new' | 'top' | 'hot';

interface Post {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  type: string;
  status: string;
  likes_count: number;
  comments_count: number;
  vote_score: number;
  created_at: string;
  user_id: string;
  author: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    is_creator: boolean;
  };
  user_vote: number | null;
}

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'creator', label: 'Criadores' },
  { key: 'community', label: 'Comunidade' },
];

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('new');
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (isRefresh = false) => {
    console.log('[Feed] fetchFeed chamado, isRefresh:', isRefresh);

    if (isRefresh) {
      setIsRefreshing(true);
      setError(null);
    } else if (!cursor) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params: { cursor?: string; type?: string; sort?: string } = {
        type: filter === 'all' ? undefined : filter,
        sort,
      };

      if (!isRefresh && cursor) {
        params.cursor = cursor;
      }

      console.log('[Feed] Chamando feedApi.getFeed com params:', params);
      const result = await feedApi.getFeed(params);
      console.log('[Feed] Resultado da API:', result);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        const response = result.data as FeedResponse;
        if (isRefresh || !cursor) {
          setPosts(response.posts || []);
        } else {
          setPosts(prev => [...prev, ...(response.posts || [])]);
        }
        setCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
      setError('Erro ao carregar feed. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [filter, sort, cursor]);

  useEffect(() => {
    setCursor(null);
    setPosts([]);
    fetchFeed(true);
  }, [filter, sort]);

  const handleRefresh = () => {
    setCursor(null);
    fetchFeed(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && cursor) {
      fetchFeed();
    }
  };

  const handleVote = async (postId: string, value: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const oldVote = post.user_vote || 0;
    const newValue = post.user_vote === value ? 0 : value;
    const newScore = post.vote_score - oldVote + newValue;

    // Atualização otimista
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return { ...p, user_vote: newValue || null, vote_score: newScore };
        }
        return p;
      })
    );

    try {
      await feedApi.vote(postId, newValue);
    } catch {
      // Reverter em caso de erro
      setPosts(prev =>
        prev.map(p => {
          if (p.id === postId) {
            return { ...p, user_vote: oldVote || null, vote_score: post.vote_score };
          }
          return p;
        })
      );
    }
  };

  const renderHeader = () => (
    <View className="px-4 py-3">
      {/* Filtros */}
      <View className="flex-row gap-2">
        {FILTER_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setFilter(opt.key)}
            className={`px-4 py-2 rounded-full ${
              filter === opt.key
                ? 'bg-primary-600'
                : 'bg-gray-100'
            }`}
          >
            <Text
              className={`font-medium ${
                filter === opt.key ? 'text-white' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator color="#8B5CF6" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">📭</Text>
        <Text className="text-gray-500 text-center">
          Nenhum post encontrado
        </Text>
      </View>
    );
  };

  if (isLoading && posts.length === 0 && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando feed...</Text>
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-6xl mb-4">🔐</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2 text-center">
          Faça login para continuar
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          Acesse com sua conta para ver o feed da comunidade
        </Text>
        <TouchableOpacity
          onPress={() => fetchFeed(true)}
          className="bg-primary-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <PostCard
              post={item}
              onVote={handleVote}
              onPress={() => router.push(`/post/${item.id}`)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
