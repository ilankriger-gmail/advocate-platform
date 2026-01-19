import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { profileApi } from '@/lib/api';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  is_creator: boolean;
  coins_balance: number;
  followers_count: number;
  following_count: number;
}

interface Stats {
  challenges_completed: number;
  rewards_claimed: number;
  posts_count: number;
  coins_balance: number;
}

interface Participation {
  id: string;
  status: string;
  result_value: number | null;
  coins_earned: number | null;
  created_at: string;
  challenge: {
    id: string;
    title: string;
    icon: string | null;
    type: string;
    coins_reward: number;
  };
}

interface ProfileResponse {
  profile: Profile;
  stats: Stats;
  recent_participations: Participation[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
};

export default function PerfilScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Funções para abrir redes sociais
  const openSocialLink = async (platform: string, handle: string) => {
    let url = '';
    let fallbackUrl = '';

    switch (platform) {
      case 'instagram':
        url = `instagram://user?username=${handle}`;
        fallbackUrl = `https://instagram.com/${handle}`;
        break;
      case 'tiktok':
        url = `tiktok://user?username=${handle}`;
        fallbackUrl = `https://tiktok.com/@${handle}`;
        break;
      case 'youtube':
        url = `youtube://www.youtube.com/@${handle}`;
        fallbackUrl = `https://youtube.com/@${handle}`;
        break;
      case 'twitter':
        url = `twitter://user?screen_name=${handle}`;
        fallbackUrl = `https://twitter.com/${handle}`;
        break;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(fallbackUrl);
      }
    } catch {
      await Linking.openURL(fallbackUrl);
    }
  };

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await profileApi.get();

      if (result.data) {
        const response = result.data as ProfileResponse;
        setProfile(response.profile);
        setStats(response.stats);
        setParticipations(response.recent_participations);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRefresh = () => {
    fetchProfile(true);
  };

  const handleLogout = () => {
    Alert.alert('Sair', 'Função desabilitada temporariamente');
  };

  if (isLoading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#8B5CF6"
          colors={['#8B5CF6']}
        />
      }
    >
      {/* Profile Header */}
      <View className="bg-white px-4 py-6 items-center border-b border-gray-100">
        {profile?.avatar_url ? (
          <Image
            source={{ uri: profile.avatar_url }}
            className="w-24 h-24 rounded-full bg-gray-200"
          />
        ) : (
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-primary-600 font-bold text-2xl">
              {getInitials(profile?.full_name || 'U')}
            </Text>
          </View>
        )}

        <View className="items-center mt-4">
          <View className="flex-row items-center">
            <Text className="font-bold text-gray-900 text-xl">
              {profile?.full_name}
            </Text>
            {profile?.is_creator && (
              <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded-full">
                <Text className="text-primary-600 text-xs font-medium">Creator</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-500 text-sm mt-1">
            {profile?.email}
          </Text>
          {profile?.bio && (
            <Text className="text-gray-600 text-center mt-2 px-8">
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Followers/Following */}
        <View className="flex-row mt-4 gap-8">
          <View className="items-center">
            <Text className="font-bold text-gray-900 text-lg">
              {profile?.followers_count || 0}
            </Text>
            <Text className="text-gray-500 text-sm">Seguidores</Text>
          </View>
          <View className="items-center">
            <Text className="font-bold text-gray-900 text-lg">
              {profile?.following_count || 0}
            </Text>
            <Text className="text-gray-500 text-sm">Seguindo</Text>
          </View>
        </View>

        {/* Social Links */}
        <View className="flex-row mt-4 gap-4">
          {profile?.instagram_handle && (
            <TouchableOpacity
              onPress={() => openSocialLink('instagram', profile.instagram_handle!)}
              className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center"
            >
              <FontAwesome name="instagram" size={20} color="#E4405F" />
            </TouchableOpacity>
          )}
          {profile?.tiktok_handle && (
            <TouchableOpacity
              onPress={() => openSocialLink('tiktok', profile.tiktok_handle!)}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <FontAwesome name="music" size={18} color="#000" />
            </TouchableOpacity>
          )}
          {profile?.youtube_handle && (
            <TouchableOpacity
              onPress={() => openSocialLink('youtube', profile.youtube_handle!)}
              className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
            >
              <FontAwesome name="youtube-play" size={18} color="#FF0000" />
            </TouchableOpacity>
          )}
          {profile?.twitter_handle && (
            <TouchableOpacity
              onPress={() => openSocialLink('twitter', profile.twitter_handle!)}
              className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center"
            >
              <FontAwesome name="twitter" size={18} color="#1DA1F2" />
            </TouchableOpacity>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          onPress={() => router.push('/perfil/editar')}
          className="mt-4 flex-row items-center bg-primary-50 px-4 py-2 rounded-full"
        >
          <FontAwesome name="pencil" size={14} color="#8B5CF6" />
          <Text className="text-primary-600 font-medium ml-2">Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="bg-white mt-3 px-4 py-5">
        <Text className="font-semibold text-gray-900 text-lg mb-4">
          Estatísticas
        </Text>
        <View className="flex-row justify-between">
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-2">
              <Text className="text-xl">❤️</Text>
            </View>
            <Text className="font-bold text-gray-900 text-lg">
              {stats?.coins_balance || 0}
            </Text>
            <Text className="text-gray-500 text-xs">Corações</Text>
          </View>
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-yellow-50 items-center justify-center mb-2">
              <FontAwesome name="trophy" size={20} color="#F59E0B" />
            </View>
            <Text className="font-bold text-gray-900 text-lg">
              {stats?.challenges_completed || 0}
            </Text>
            <Text className="text-gray-500 text-xs">Desafios</Text>
          </View>
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-purple-50 items-center justify-center mb-2">
              <FontAwesome name="gift" size={20} color="#8B5CF6" />
            </View>
            <Text className="font-bold text-gray-900 text-lg">
              {stats?.rewards_claimed || 0}
            </Text>
            <Text className="text-gray-500 text-xs">Resgates</Text>
          </View>
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-2">
              <FontAwesome name="file-text-o" size={18} color="#3B82F6" />
            </View>
            <Text className="font-bold text-gray-900 text-lg">
              {stats?.posts_count || 0}
            </Text>
            <Text className="text-gray-500 text-xs">Posts</Text>
          </View>
        </View>
      </View>

      {/* Recent Participations */}
      {participations.length > 0 && (
        <View className="bg-white mt-3 px-4 py-5">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            Participações Recentes
          </Text>
          {participations.map(participation => {
            const statusInfo = STATUS_LABELS[participation.status] || {
              label: participation.status,
              color: 'bg-gray-100 text-gray-700',
            };
            return (
              <View
                key={participation.id}
                className="flex-row items-center py-3 border-b border-gray-100 last:border-b-0"
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                  <Text>{participation.challenge?.icon || '🎯'}</Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="font-medium text-gray-900" numberOfLines={1}>
                    {participation.challenge?.title}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View className={`px-2 py-0.5 rounded-full ${statusInfo.color.split(' ')[0]}`}>
                      <Text className={`text-xs font-medium ${statusInfo.color.split(' ')[1]}`}>
                        {statusInfo.label}
                      </Text>
                    </View>
                    {participation.coins_earned && participation.coins_earned > 0 && (
                      <View className="flex-row items-center ml-2">
                        <Text className="text-sm">❤️</Text>
                        <Text className="text-green-600 text-xs font-medium ml-1">
                          +{participation.coins_earned}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Actions */}
      <View className="bg-white mt-3 px-4 py-3 mb-8">
        {stats && stats.posts_count > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/perfil/posts')}
            className="flex-row items-center py-4 border-b border-gray-100"
          >
            <FontAwesome name="file-text-o" size={20} color="#3B82F6" />
            <Text className="flex-1 ml-4 text-gray-900 font-medium">
              Meus Posts
            </Text>
            <View className="bg-blue-100 px-2 py-0.5 rounded-full mr-2">
              <Text className="text-blue-600 text-xs font-medium">{stats.posts_count}</Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-100"
        >
          <FontAwesome name="cog" size={20} color="#6B7280" />
          <Text className="flex-1 ml-4 text-gray-900 font-medium">
            Configurações
          </Text>
          <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center py-4 border-b border-gray-100"
        >
          <FontAwesome name="question-circle-o" size={20} color="#6B7280" />
          <Text className="flex-1 ml-4 text-gray-900 font-medium">
            Ajuda
          </Text>
          <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center py-4"
        >
          <FontAwesome name="sign-out" size={20} color="#EF4444" />
          <Text className="flex-1 ml-4 text-red-500 font-medium">
            Sair
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
