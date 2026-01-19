import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usersApi } from '@/lib/api';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  followers_count: number;
  following_count: number;
  posts_count: number;
  total_likes: number;
  created_at: string;
}

interface ProfileResponse {
  profile: Profile;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!id) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await usersApi.getById(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        const response = result.data as ProfileResponse;
        setProfile(response.profile);
        setIsFollowing(response.isFollowing);
        setIsOwnProfile(response.isOwnProfile);
      }
    } catch (err) {
      setError('Erro ao carregar perfil');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!id || isFollowLoading) return;

    setIsFollowLoading(true);

    try {
      if (isFollowing) {
        const result = await usersApi.unfollow(id);
        if (!result.error) {
          setIsFollowing(false);
          if (profile) {
            setProfile({ ...profile, followers_count: profile.followers_count - 1 });
          }
        }
      } else {
        const result = await usersApi.follow(id);
        if (!result.error) {
          setIsFollowing(true);
          if (profile) {
            setProfile({ ...profile, followers_count: profile.followers_count + 1 });
          }
        }
      }
    } catch (err) {
      console.error('Erro ao seguir/deixar de seguir:', err);
    } finally {
      setIsFollowLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando perfil...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-6xl mb-4">😕</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">Perfil não encontrado</Text>
        <Text className="text-gray-500 text-center mb-6">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: profile.full_name || 'Perfil',
          headerShown: true,
          headerBackTitle: 'Voltar',
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchProfile(true)}
            tintColor="#8B5CF6"
            colors={['#8B5CF6']}
          />
        }
      >
        {/* Profile Header */}
        <View className="bg-white px-4 py-6 items-center border-b border-gray-100">
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              className="w-24 h-24 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary-600 font-bold text-2xl">
                {getInitials(profile.full_name || 'U')}
              </Text>
            </View>
          )}

          <View className="items-center mt-4">
            <View className="flex-row items-center">
              <Text className="font-bold text-gray-900 text-xl">
                {profile.full_name}
              </Text>
              {profile.is_creator && (
                <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded-full">
                  <Text className="text-primary-600 text-xs font-medium">Creator</Text>
                </View>
              )}
            </View>
            {profile.bio && (
              <Text className="text-gray-600 text-center mt-2 px-8">
                {profile.bio}
              </Text>
            )}
          </View>

          {/* Followers/Following */}
          <View className="flex-row mt-4 gap-8">
            <View className="items-center">
              <Text className="font-bold text-gray-900 text-lg">
                {profile.followers_count || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Seguidores</Text>
            </View>
            <View className="items-center">
              <Text className="font-bold text-gray-900 text-lg">
                {profile.following_count || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Seguindo</Text>
            </View>
          </View>

          {/* Social Links */}
          <View className="flex-row mt-4 gap-4">
            {profile.instagram_handle && (
              <TouchableOpacity
                onPress={() => openSocialLink('instagram', profile.instagram_handle!)}
                className="w-10 h-10 rounded-full bg-pink-50 items-center justify-center"
              >
                <FontAwesome name="instagram" size={20} color="#E4405F" />
              </TouchableOpacity>
            )}
            {profile.tiktok_handle && (
              <TouchableOpacity
                onPress={() => openSocialLink('tiktok', profile.tiktok_handle!)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <FontAwesome name="music" size={18} color="#000" />
              </TouchableOpacity>
            )}
            {profile.youtube_handle && (
              <TouchableOpacity
                onPress={() => openSocialLink('youtube', profile.youtube_handle!)}
                className="w-10 h-10 rounded-full bg-red-50 items-center justify-center"
              >
                <FontAwesome name="youtube-play" size={18} color="#FF0000" />
              </TouchableOpacity>
            )}
            {profile.twitter_handle && (
              <TouchableOpacity
                onPress={() => openSocialLink('twitter', profile.twitter_handle!)}
                className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center"
              >
                <FontAwesome name="twitter" size={18} color="#1DA1F2" />
              </TouchableOpacity>
            )}
          </View>

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              onPress={handleFollow}
              disabled={isFollowLoading}
              className={`mt-4 px-6 py-2.5 rounded-full ${
                isFollowing
                  ? 'bg-gray-100 border border-gray-300'
                  : 'bg-primary-600'
              }`}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? '#6B7280' : '#fff'} />
              ) : (
                <Text
                  className={`font-semibold ${
                    isFollowing ? 'text-gray-700' : 'text-white'
                  }`}
                >
                  {isFollowing ? 'Seguindo' : 'Seguir'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => router.push('/perfil/editar')}
              className="mt-4 flex-row items-center bg-primary-50 px-4 py-2 rounded-full"
            >
              <FontAwesome name="pencil" size={14} color="#8B5CF6" />
              <Text className="text-primary-600 font-medium ml-2">Editar Perfil</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View className="bg-white mt-3 px-4 py-5">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            Estatísticas
          </Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center mb-2">
                <FontAwesome name="file-text-o" size={18} color="#3B82F6" />
              </View>
              <Text className="font-bold text-gray-900 text-lg">
                {profile.posts_count || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Posts</Text>
            </View>
            <View className="items-center">
              <View className="w-12 h-12 rounded-full bg-pink-50 items-center justify-center mb-2">
                <FontAwesome name="heart" size={18} color="#EC4899" />
              </View>
              <Text className="font-bold text-gray-900 text-lg">
                {profile.total_likes || 0}
              </Text>
              <Text className="text-gray-500 text-xs">Curtidas</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View className="bg-white mt-3 px-4 py-5 mb-8">
          <Text className="font-semibold text-gray-900 text-lg mb-4">
            Informações
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-gray-500">Membro desde</Text>
            <Text className="text-gray-900">{formatDate(profile.created_at)}</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
