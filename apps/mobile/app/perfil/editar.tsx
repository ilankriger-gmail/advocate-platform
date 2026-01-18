import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
  website_url: string | null;
}

interface ProfileResponse {
  profile: Profile;
}

export default function EditarPerfilScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_handle: '',
    twitter_handle: '',
    website_url: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const result = await profileApi.get();
      if (result.data) {
        const response = result.data as ProfileResponse;
        setFormData({
          full_name: response.profile.full_name || '',
          bio: response.profile.bio || '',
          instagram_handle: response.profile.instagram_handle || '',
          tiktok_handle: response.profile.tiktok_handle || '',
          youtube_handle: response.profile.youtube_handle || '',
          twitter_handle: response.profile.twitter_handle || '',
          website_url: response.profile.website_url || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await profileApi.update(formData);

      if (result.error) {
        Alert.alert('Erro', result.error);
        return;
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Stack.Screen
          options={{
            title: 'Editar Perfil',
            headerBackTitle: 'Voltar',
          }}
        />
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <Stack.Screen
        options={{
          title: 'Editar Perfil',
          headerBackTitle: 'Voltar',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className="mr-2"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <Text className="text-primary-600 font-semibold text-base">Salvar</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1 bg-gray-50">
        {/* Informações Básicas */}
        <View className="bg-white mt-3 px-4 py-5">
          <Text className="text-gray-500 text-xs uppercase mb-4 font-medium">
            Informações Básicas
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">Nome Completo *</Text>
              <TextInput
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                placeholder="Seu nome completo"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Bio</Text>
              <TextInput
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Conte um pouco sobre você..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[100px]"
              />
            </View>
          </View>
        </View>

        {/* Redes Sociais */}
        <View className="bg-white mt-3 px-4 py-5">
          <Text className="text-gray-500 text-xs uppercase mb-4 font-medium">
            Redes Sociais
          </Text>

          <View className="space-y-4">
            <View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="instagram" size={16} color="#E4405F" />
                <Text className="text-gray-700 font-medium ml-2">Instagram</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <Text className="text-gray-400 pl-4">@</Text>
                <TextInput
                  value={formData.instagram_handle}
                  onChangeText={(text) => setFormData({ ...formData, instagram_handle: text.replace('@', '') })}
                  placeholder="seu.usuario"
                  autoCapitalize="none"
                  className="flex-1 px-2 py-3 text-gray-900"
                />
              </View>
            </View>

            <View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="music" size={16} color="#000" />
                <Text className="text-gray-700 font-medium ml-2">TikTok</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <Text className="text-gray-400 pl-4">@</Text>
                <TextInput
                  value={formData.tiktok_handle}
                  onChangeText={(text) => setFormData({ ...formData, tiktok_handle: text.replace('@', '') })}
                  placeholder="seu.usuario"
                  autoCapitalize="none"
                  className="flex-1 px-2 py-3 text-gray-900"
                />
              </View>
            </View>

            <View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="youtube-play" size={16} color="#FF0000" />
                <Text className="text-gray-700 font-medium ml-2">YouTube</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <Text className="text-gray-400 pl-4">@</Text>
                <TextInput
                  value={formData.youtube_handle}
                  onChangeText={(text) => setFormData({ ...formData, youtube_handle: text.replace('@', '') })}
                  placeholder="seu.canal"
                  autoCapitalize="none"
                  className="flex-1 px-2 py-3 text-gray-900"
                />
              </View>
            </View>

            <View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="twitter" size={16} color="#1DA1F2" />
                <Text className="text-gray-700 font-medium ml-2">Twitter/X</Text>
              </View>
              <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl">
                <Text className="text-gray-400 pl-4">@</Text>
                <TextInput
                  value={formData.twitter_handle}
                  onChangeText={(text) => setFormData({ ...formData, twitter_handle: text.replace('@', '') })}
                  placeholder="seu.usuario"
                  autoCapitalize="none"
                  className="flex-1 px-2 py-3 text-gray-900"
                />
              </View>
            </View>

            <View>
              <View className="flex-row items-center mb-2">
                <FontAwesome name="globe" size={16} color="#6B7280" />
                <Text className="text-gray-700 font-medium ml-2">Website</Text>
              </View>
              <TextInput
                value={formData.website_url}
                onChangeText={(text) => setFormData({ ...formData, website_url: text })}
                placeholder="https://seusite.com"
                autoCapitalize="none"
                keyboardType="url"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View className="px-4 py-6">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`py-4 rounded-xl items-center ${isSaving ? 'bg-primary-300' : 'bg-primary-600'}`}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
