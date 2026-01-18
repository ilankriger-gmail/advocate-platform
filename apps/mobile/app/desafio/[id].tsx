import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { challengesApi } from '@/lib/api';
import ParticipationModal from '@/components/ParticipationModal';
import YouTubePreview from '@/components/YouTubePreview';

interface Winner {
  id: string;
  instagram_username: string;
  prize_amount: number;
  pix_sent: boolean;
  created_at: string;
}

interface Prize {
  id: string;
  type: string;
  description: string;
  quantity: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string | null;
  status: string;
  coins_reward: number;
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  prize_amount: number | null;
  num_winners: number | null;
  record_video_url: string | null;
  action_instructions: string | null;
  raffle_enabled: boolean;
  raffle_prize_amount: number | null;
  raffle_frequency_days: number | null;
  instagram_embed_url: string | null;
  participants_count: number;
  user_participation: {
    id: string;
    status: string;
    result_value: number | null;
    coins_earned: number | null;
  } | null;
  has_participated: boolean;
  winners: Winner[];
  prizes: Prize[];
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  engajamento: { label: 'Engajamento', color: 'text-blue-700', bg: 'bg-blue-100' },
  fisico: { label: 'Desafio Físico', color: 'text-green-700', bg: 'bg-green-100' },
  atos_amor: { label: 'Atos de Amor', color: 'text-pink-700', bg: 'bg-pink-100' },
  participe: { label: 'Participe', color: 'text-purple-700', bg: 'bg-purple-100' },
};

const STATUS_CONFIG = {
  pending: { label: 'Aguardando Análise', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: 'clock-o' },
  approved: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-100', icon: 'check-circle' },
  rejected: { label: 'Rejeitado', color: 'text-red-700', bg: 'bg-red-100', icon: 'times-circle' },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChallenge = useCallback(async (isRefresh = false) => {
    if (!id) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await challengesApi.getById(id);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setChallenge((result.data as { challenge: Challenge }).challenge);
      }
    } catch (err) {
      setError('Erro ao carregar desafio');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  const handleOpenInstagram = () => {
    if (challenge?.instagram_embed_url) {
      Linking.openURL(challenge.instagram_embed_url);
    }
  };

  const handleOpenYouTube = () => {
    if (challenge?.record_video_url) {
      Linking.openURL(challenge.record_video_url);
    }
  };

  const formatGoal = () => {
    if (!challenge?.goal_value) return null;

    if (challenge.goal_type === 'time') {
      const minutes = Math.floor(challenge.goal_value / 60);
      const seconds = challenge.goal_value % 60;
      return minutes > 0 ? `${minutes} min ${seconds}s` : `${seconds} segundos`;
    }

    return `${challenge.goal_value} repetições`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysLeft = () => {
    if (!challenge?.ends_at) return null;
    const end = new Date(challenge.ends_at);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando desafio...</Text>
      </View>
    );
  }

  if (error || !challenge) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-8">
        <Text className="text-6xl mb-4">😕</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">Desafio não encontrado</Text>
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

  const typeInfo = TYPE_LABELS[challenge.type] || TYPE_LABELS.participe;
  const daysLeft = getDaysLeft();
  const participation = challenge.user_participation;
  const statusConfig = participation ? STATUS_CONFIG[participation.status as keyof typeof STATUS_CONFIG] : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Detalhes do Desafio',
          headerShown: true,
          headerBackTitle: 'Voltar',
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchChallenge(true)}
            tintColor="#8B5CF6"
          />
        }
      >
        {/* Header Image */}
        {(challenge.thumbnail_url || challenge.image_url) && (
          <Image
            source={{ uri: challenge.thumbnail_url || challenge.image_url || '' }}
            className="w-full h-56 bg-gray-200"
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View className="p-4 space-y-4">
          {/* Type & Status */}
          <View className="flex-row items-center justify-between">
            <View className={`px-3 py-1.5 rounded-full ${typeInfo.bg}`}>
              <Text className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</Text>
            </View>

            {daysLeft !== null && daysLeft > 0 && (
              <View className="flex-row items-center bg-amber-100 px-3 py-1.5 rounded-full">
                <FontAwesome name="clock-o" size={14} color="#D97706" />
                <Text className="text-amber-700 font-medium text-sm ml-1.5">
                  {daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <View className="flex-row items-center gap-3">
            {challenge.icon && (
              <View className="w-14 h-14 bg-primary-100 rounded-2xl items-center justify-center">
                <Text className="text-3xl">{challenge.icon}</Text>
              </View>
            )}
            <Text className="text-gray-900 font-bold text-2xl flex-1">{challenge.title}</Text>
          </View>

          {/* Prize Banner */}
          {challenge.prize_amount && challenge.prize_amount > 0 && (
            <View className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
                  <Text className="text-3xl">💵</Text>
                </View>
                <View>
                  <Text className="text-white font-black text-2xl">
                    R$ {challenge.prize_amount.toFixed(0)}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {challenge.num_winners} ganhador(es) por sorteio
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Rewards */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-900 font-semibold text-lg mb-3">Recompensas</Text>
            <View className="flex-row flex-wrap gap-3">
              {challenge.coins_reward > 0 && (
                <View className="flex-row items-center bg-red-50 px-4 py-2 rounded-xl">
                  <Text className="text-xl mr-2">❤️</Text>
                  <Text className="text-red-600 font-bold">{challenge.coins_reward} corações</Text>
                </View>
              )}
              {challenge.prizes?.map((prize) => (
                <View key={prize.id} className="flex-row items-center bg-purple-50 px-4 py-2 rounded-xl">
                  <Text className="text-xl mr-2">🎁</Text>
                  <Text className="text-purple-600 font-medium">{prize.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-gray-900 font-semibold text-lg mb-2">Descrição</Text>
            <Text className="text-gray-600 leading-6">{challenge.description}</Text>

            {challenge.action_instructions && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-gray-900 font-semibold mb-2">Instruções</Text>
                <Text className="text-gray-600 leading-6">{challenge.action_instructions}</Text>
              </View>
            )}
          </View>

          {/* Goal (for physical challenges) */}
          {challenge.goal_value && (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-gray-900 font-semibold text-lg mb-3">Meta do Desafio</Text>
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-green-100 rounded-xl items-center justify-center">
                  <FontAwesome name="bullseye" size={24} color="#059669" />
                </View>
                <Text className="text-gray-900 font-bold text-xl">{formatGoal()}</Text>
              </View>
            </View>
          )}

          {/* YouTube Reference Video */}
          {challenge.record_video_url && (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-gray-900 font-semibold text-lg mb-3">Vídeo de Referência</Text>
              <YouTubePreview
                url={challenge.record_video_url}
                title="Veja como fazer o desafio"
              />
            </View>
          )}

          {/* Instagram Link */}
          {challenge.instagram_embed_url && (
            <TouchableOpacity
              onPress={handleOpenInstagram}
              className="bg-white rounded-2xl p-4 border border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-pink-100 rounded-xl items-center justify-center">
                  <FontAwesome name="instagram" size={24} color="#E4405F" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium">Ver post no Instagram</Text>
                  <Text className="text-gray-500 text-sm">Acesse o post original</Text>
                </View>
                <FontAwesome name="external-link" size={16} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}

          {/* Hashtag */}
          {challenge.hashtag && (
            <View className="bg-primary-50 rounded-2xl p-4">
              <Text className="text-primary-600 font-semibold text-lg mb-1">Use a hashtag</Text>
              <Text className="text-primary-700 font-bold text-xl">#{challenge.hashtag}</Text>
            </View>
          )}

          {/* Raffle Info */}
          {challenge.raffle_enabled && (
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-2xl">🎰</Text>
                <Text className="text-amber-800 font-semibold text-lg">Sorteio</Text>
              </View>
              <Text className="text-amber-700">
                Sorteio de R$ {challenge.raffle_prize_amount?.toFixed(0)} a cada{' '}
                {challenge.raffle_frequency_days} dias entre os participantes!
              </Text>
            </View>
          )}

          {/* Winners */}
          {challenge.winners && challenge.winners.length > 0 && (
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-gray-900 font-semibold text-lg mb-3">Ganhadores Recentes</Text>
              {challenge.winners.map((winner) => (
                <View key={winner.id} className="flex-row items-center py-2 border-b border-gray-50 last:border-b-0">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                    <FontAwesome name="trophy" size={16} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">@{winner.instagram_username}</Text>
                    <Text className="text-gray-500 text-xs">
                      {formatDate(winner.created_at)}
                    </Text>
                  </View>
                  {winner.pix_sent && (
                    <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                      <FontAwesome name="check" size={10} color="#059669" />
                      <Text className="text-green-700 text-xs font-medium ml-1">PIX enviado</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Participants */}
          <View className="flex-row items-center justify-center py-2">
            <FontAwesome name="users" size={16} color="#9CA3AF" />
            <Text className="text-gray-500 ml-2">
              {challenge.participants_count} participante{challenge.participants_count !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* User Participation Status */}
          {participation && statusConfig && (
            <View className={`rounded-2xl p-4 ${statusConfig.bg}`}>
              <View className="flex-row items-center gap-3">
                <FontAwesome name={statusConfig.icon as any} size={24} color={statusConfig.color.replace('text-', '')} />
                <View className="flex-1">
                  <Text className={`font-semibold text-lg ${statusConfig.color}`}>
                    {statusConfig.label}
                  </Text>
                  {participation.status === 'approved' && participation.coins_earned && (
                    <Text className="text-green-600">
                      Você ganhou {participation.coins_earned} corações!
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Spacer for button */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      {!challenge.has_participated ? (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={() => setIsModalOpen(true)}
            className="bg-primary-600 py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-lg">Participar do Desafio</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <View className="bg-green-100 py-4 rounded-2xl items-center flex-row justify-center gap-2">
            <FontAwesome name="check-circle" size={20} color="#059669" />
            <Text className="text-green-700 font-bold text-lg">Você já está participando</Text>
          </View>
        </View>
      )}

      {/* Participation Modal */}
      <ParticipationModal
        challenge={challenge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchChallenge(true);
        }}
      />
    </>
  );
}
