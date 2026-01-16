import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ChallengeCard from '@/components/ChallengeCard';
import ParticipationModal from '@/components/ParticipationModal';
import { challengesApi } from '@/lib/api';

type StatusType = 'active' | 'closed' | 'finished';
type ChallengeType = 'all' | 'engajamento' | 'fisico' | 'atos_amor' | 'participe';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  icon: string | null;
  status: string;
  coins_reward: number;
  goal_type: string | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  starts_at: string | null;
  ends_at: string | null;
  image_url: string | null;
  prize_amount: number | null;
  num_winners: number | null;
  participants_count: number;
  user_participation: {
    status: string;
    result_value: number | null;
    coins_earned: number | null;
  } | null;
  has_participated: boolean;
}

interface ChallengesResponse {
  challenges: Challenge[];
}

const STATUS_OPTIONS: { key: StatusType; label: string }[] = [
  { key: 'active', label: 'Ativos' },
  { key: 'closed', label: 'Encerrados' },
  { key: 'finished', label: 'Finalizados' },
];

const TYPE_OPTIONS: { key: ChallengeType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'engajamento', label: '📱 Engajamento' },
  { key: 'fisico', label: '🏃 Físico' },
  { key: 'atos_amor', label: '💕 Atos de Amor' },
  { key: 'participe', label: '🎉 Participe' },
];

export default function DesafiosScreen() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<StatusType>('active');
  const [type, setType] = useState<ChallengeType>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchChallenges = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: { status?: string; type?: string } = {
        status,
        type: type === 'all' ? undefined : type,
      };

      const result = await challengesApi.getAll(params);

      if (result.data) {
        const response = result.data as ChallengesResponse;
        setChallenges(response.challenges);
      }
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [status, type]);

  useEffect(() => {
    fetchChallenges();
  }, [status, type]);

  const handleRefresh = () => {
    fetchChallenges(true);
  };

  const handleParticipate = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleParticipationSuccess = () => {
    // Atualizar lista de desafios após participação bem-sucedida
    fetchChallenges(true);
  };

  const renderHeader = () => (
    <View className="pb-3">
      {/* Status Tabs */}
      <View className="flex-row px-4 mb-3">
        {STATUS_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setStatus(opt.key)}
            className={`flex-1 py-3 ${
              status === opt.key
                ? 'border-b-2 border-primary-600'
                : 'border-b-2 border-transparent'
            }`}
          >
            <Text
              className={`text-center font-medium ${
                status === opt.key ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Type Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {TYPE_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setType(opt.key)}
            className={`px-4 py-2 rounded-full ${
              type === opt.key
                ? 'bg-primary-600'
                : 'bg-gray-100'
            }`}
          >
            <Text
              className={`font-medium ${
                type === opt.key ? 'text-white' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">🎯</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">
          Nenhum desafio encontrado
        </Text>
        <Text className="text-gray-500 text-center px-8">
          {status === 'active'
            ? 'Não há desafios ativos no momento. Volte em breve!'
            : 'Não há desafios nesta categoria.'}
        </Text>
      </View>
    );
  };

  if (isLoading && challenges.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando desafios...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={challenges}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <ChallengeCard
              challenge={item}
              onPress={() => {
                // TODO: Navegar para detalhe do desafio
              }}
              onParticipate={() => handleParticipate(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
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

      {/* Modal de Participação */}
      <ParticipationModal
        challenge={selectedChallenge}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleParticipationSuccess}
      />
    </View>
  );
}
