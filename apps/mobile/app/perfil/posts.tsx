import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { profileApi } from '@/lib/api';

interface Post {
  id: string;
  title: string;
  content: string;
  type: string;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  status: string;
  created_at: string;
  votes_count: number;
}

interface PostsResponse {
  posts: Post[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  approved: { label: 'Aprovado', bg: 'bg-green-100', text: 'text-green-700' },
  pending: { label: 'Pendente', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  rejected: { label: 'Rejeitado', bg: 'bg-red-100', text: 'text-red-700' },
};

const TYPE_CONFIG: Record<string, { icon: string; label: string }> = {
  text: { icon: 'file-text-o', label: 'Texto' },
  image: { icon: 'image', label: 'Imagem' },
  video: { icon: 'video-camera', label: 'Vídeo' },
  link: { icon: 'link', label: 'Link' },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Extrai ID do YouTube da URL
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
  return match ? match[1] : null;
}

export default function MeusPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await profileApi.getPosts();

      if (result.data) {
        const response = result.data as PostsResponse;
        setPosts(response.posts || []);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleRefresh = () => {
    fetchPosts(true);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.text;

    // Gerar thumbnail se for vídeo do YouTube
    let thumbnailUrl = item.image_url;
    if (item.type === 'video' && item.video_url) {
      const ytId = getYouTubeId(item.video_url);
      if (ytId) {
        thumbnailUrl = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
      }
    }

    return (
      <TouchableOpacity
        onPress={() => router.push(`/post/${item.id}`)}
        activeOpacity={0.8}
        className="bg-white mx-4 mb-3 rounded-xl overflow-hidden border border-gray-100"
      >
        <View className="flex-row">
          {/* Thumbnail */}
          {thumbnailUrl ? (
            <Image
              source={{ uri: thumbnailUrl }}
              className="w-24 h-24 bg-gray-100"
              resizeMode="cover"
            />
          ) : (
            <View className="w-24 h-24 bg-primary-50 items-center justify-center">
              <FontAwesome name={typeConfig.icon as keyof typeof FontAwesome.glyphMap} size={24} color="#8B5CF6" />
            </View>
          )}

          {/* Content */}
          <View className="flex-1 p-3 justify-between">
            <View>
              <View className="flex-row items-center gap-2 mb-1">
                <View className={`px-2 py-0.5 rounded-full ${statusConfig.bg}`}>
                  <Text className={`text-[10px] font-medium ${statusConfig.text}`}>
                    {statusConfig.label}
                  </Text>
                </View>
                <View className="bg-gray-100 px-2 py-0.5 rounded-full flex-row items-center">
                  <FontAwesome name={typeConfig.icon as keyof typeof FontAwesome.glyphMap} size={10} color="#6B7280" />
                  <Text className="text-gray-600 text-[10px] font-medium ml-1">
                    {typeConfig.label}
                  </Text>
                </View>
              </View>

              <Text className="text-gray-900 font-semibold" numberOfLines={2}>
                {item.title}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-gray-400 text-xs">
                {formatDate(item.created_at)}
              </Text>
              <View className="flex-row items-center">
                <FontAwesome name="heart" size={12} color="#EF4444" />
                <Text className="text-gray-600 text-xs ml-1">
                  {item.votes_count}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">📝</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">
          Nenhum post ainda
        </Text>
        <Text className="text-gray-500 text-center px-8">
          Quando você publicar conteúdo, ele aparecerá aqui.
        </Text>
      </View>
    );
  };

  if (isLoading && posts.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Stack.Screen
          options={{
            title: 'Meus Posts',
            headerBackTitle: 'Voltar',
          }}
        />
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando posts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Meus Posts',
          headerBackTitle: 'Voltar',
        }}
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      />
    </View>
  );
}
