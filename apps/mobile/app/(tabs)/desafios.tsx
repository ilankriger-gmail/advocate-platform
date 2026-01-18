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
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ChallengeCard from '@/components/ChallengeCard';
import ParticipationModal from '@/components/ParticipationModal';
import CoinsBalanceCard from '@/components/CoinsBalanceCard';
import MyParticipationCard from '@/components/MyParticipationCard';
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
  thumbnail_url: string | null;
  prize_amount: number | null;
  num_winners: number | null;
  record_video_url: string | null;
  instagram_embed_url: string | null;
  participants_count: number;
  user_participation: {
    status: string;
    result_value: number | null;
    coins_earned: number | null;
  } | null;
  has_participated: boolean;
}

interface Participation {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  result_value: number | null;
  coins_earned: number | null;
  video_proof_url: string | null;
  created_at: string;
  challenge: {
    id: string;
    title: string;
    icon: string | null;
    goal_type: 'repetitions' | 'time' | null;
    goal_value: number | null;
    coins_reward: number;
  };
}

interface ChallengesResponse {
  challenges: Challenge[];
}

interface ParticipationsResponse {
  participations: Participation[];
  coins_balance: number;
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
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [coinsBalance, setCoinsBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<StatusType>('active');
  const [type, setType] = useState<ChallengeType>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllParticipations, setShowAllParticipations] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Buscar desafios e participações em paralelo
      const [challengesResult, participationsResult] = await Promise.all([
        challengesApi.getAll({
          status,
          type: type === 'all' ? undefined : type,
        }),
        challengesApi.getMyParticipations(),
      ]);

      if (challengesResult.data) {
        const response = challengesResult.data as ChallengesResponse;
        setChallenges(response.challenges);
      }

      if (participationsResult.data) {
        const response = participationsResult.data as ParticipationsResponse;
        setParticipations(response.participations);
        setCoinsBalance(response.coins_balance);
      }
    } catch (error) {
      console.error('Erro ao carregar desafios:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [status, type]);

  useEffect(() => {
    fetchData();
  }, [status, type]);

  const handleRefresh = () => {
    fetchData(true);
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
    fetchData(true);
  };

  // Separar desafios com prêmio PIX
  const pixChallenges = challenges.filter(c => c.prize_amount && c.prize_amount > 0);
  const regularChallenges = challenges.filter(c => !c.prize_amount || c.prize_amount === 0);

  // Limitar participações exibidas
  const displayedParticipations = showAllParticipations
    ? participations
    : participations.slice(0, 3);

  const renderHeader = () => (
    <View className="space-y-4 pb-3">
      {/* Card de Saldo */}
      <View className="px-4 pt-2">
        <CoinsBalanceCard balance={coinsBalance} />
      </View>

      {/* Minhas Participações */}
      {participations.length > 0 && (
        <View className="px-4 space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 bg-amber-100 rounded-xl items-center justify-center">
                <FontAwesome name="trophy" size={18} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-lg">Minhas Participações</Text>
                <Text className="text-gray-500 text-xs">Acompanhe seus envios</Text>
              </View>
            </View>
            {participations.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllParticipations(!showAllParticipations)}
                className="px-3 py-1.5 bg-gray-100 rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium">
                  {showAllParticipations ? 'Ver menos' : `Ver todas (${participations.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="space-y-2">
            {displayedParticipations.map((participation) => (
              <MyParticipationCard
                key={participation.id}
                participation={participation}
                onPress={() => router.push(`/desafio/${participation.challenge.id}`)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Banner de PIX (se houver desafios com prêmio) */}
      {pixChallenges.length > 0 && (
        <View className="mx-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 shadow-lg">
          <View className="flex-row items-center gap-3">
            <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center">
              <Text className="text-3xl">💵</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-xl">GANHE PIX!</Text>
              <Text className="text-white/80 text-sm">
                {pixChallenges.length} desafio(s) com prêmio em dinheiro
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Status Tabs */}
      <View className="flex-row px-4">
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

  const renderChallengeItem = ({ item }: { item: Challenge }) => {
    const isPix = item.prize_amount && item.prize_amount > 0;

    return (
      <View className="px-4">
        {/* Badge de PIX para desafios com prêmio */}
        {isPix && (
          <View className="bg-green-500 rounded-t-xl px-3 py-1.5 flex-row items-center gap-2">
            <Text className="text-white font-bold text-sm">
              💵 PRÊMIO: R$ {item.prize_amount?.toFixed(0)}
            </Text>
            {item.num_winners && (
              <Text className="text-white/80 text-xs">
                • {item.num_winners} ganhador(es)
              </Text>
            )}
          </View>
        )}
        <ChallengeCard
          challenge={item}
          onPress={() => router.push(`/desafio/${item.id}`)}
          onParticipate={() => handleParticipate(item.id)}
          style={isPix ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined}
        />
      </View>
    );
  };

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
        renderItem={renderChallengeItem}
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
