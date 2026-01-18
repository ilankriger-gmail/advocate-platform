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
import FontAwesome from '@expo/vector-icons/FontAwesome';
import RewardCard from '@/components/RewardCard';
import RewardClaimModal from '@/components/RewardClaimModal';
import MyClaimCard from '@/components/MyClaimCard';
import { rewardsApi } from '@/lib/api';

type RewardType = 'all' | 'digital' | 'physical' | 'money';

interface Reward {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  coins_required: number;
  quantity_available: number | null;
  type: string;
  is_active: boolean;
  available_options: string[] | null;
  can_claim: boolean;
  has_stock: boolean;
}

interface RewardsResponse {
  rewards: Reward[];
  user_balance: number;
}

interface Claim {
  id: string;
  coins_spent: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  selected_option: string | null;
  created_at: string;
  reward: {
    id: string;
    name: string;
    description: string;
    image_url: string | null;
    type: string;
  };
}

interface ClaimsResponse {
  claims: Claim[];
}

const TYPE_OPTIONS: { key: RewardType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'digital', label: '🎁 Digital' },
  { key: 'physical', label: '📦 Físico' },
  { key: 'money', label: '💰 Dinheiro' },
];

export default function PremiosScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [type, setType] = useState<RewardType>('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllClaims, setShowAllClaims] = useState(false);

  const fetchRewards = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params: { type?: string } = {
        type: type === 'all' ? undefined : type,
      };

      // Buscar prêmios e resgates em paralelo
      const [rewardsResult, claimsResult] = await Promise.all([
        rewardsApi.getAll(params),
        rewardsApi.getMyClaims(),
      ]);

      if (rewardsResult.data) {
        const response = rewardsResult.data as RewardsResponse;
        setRewards(response.rewards);
        setUserBalance(response.user_balance);
      }

      if (claimsResult.data) {
        const response = claimsResult.data as ClaimsResponse;
        setClaims(response.claims);
      }
    } catch (error) {
      console.error('Erro ao carregar prêmios:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [type]);

  useEffect(() => {
    fetchRewards();
  }, [type]);

  const handleRefresh = () => {
    fetchRewards(true);
  };

  const handleClaim = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward) {
      setSelectedReward(reward);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReward(null);
  };

  const handleClaimSuccess = () => {
    fetchRewards(true);
  };

  // Limitar resgates exibidos
  const displayedClaims = showAllClaims ? claims : claims.slice(0, 3);

  const renderHeader = () => (
    <View className="pb-4 space-y-4">
      {/* Balance Card */}
      <View className="mx-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-5">
        <Text className="text-white/80 text-sm font-medium mb-1">
          Seu saldo
        </Text>
        <View className="flex-row items-center">
          <Text className="text-3xl mr-2">❤️</Text>
          <Text className="text-white text-4xl font-bold">
            {userBalance}
          </Text>
          <Text className="text-white/80 ml-2">corações</Text>
        </View>
        <Text className="text-white/60 text-xs mt-2">
          Complete desafios para ganhar mais corações!
        </Text>
      </View>

      {/* Meus Resgates */}
      {claims.length > 0 && (
        <View className="px-4 space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                <FontAwesome name="gift" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-lg">Meus Resgates</Text>
                <Text className="text-gray-500 text-xs">Acompanhe seus prêmios</Text>
              </View>
            </View>
            {claims.length > 3 && (
              <TouchableOpacity
                onPress={() => setShowAllClaims(!showAllClaims)}
                className="px-3 py-1.5 bg-gray-100 rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium">
                  {showAllClaims ? 'Ver menos' : `Ver todos (${claims.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="space-y-2">
            {displayedClaims.map((claim) => (
              <MyClaimCard key={claim.id} claim={claim} />
            ))}
          </View>
        </View>
      )}

      {/* Título da seção de prêmios */}
      <View className="px-4 pt-2">
        <Text className="text-gray-900 font-bold text-lg mb-1">Prêmios Disponíveis</Text>
        <Text className="text-gray-500 text-sm">Troque seus corações por prêmios incríveis</Text>
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
                : 'bg-white border border-gray-200'
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
        <Text className="text-6xl mb-4">🎁</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">
          Nenhum prêmio disponível
        </Text>
        <Text className="text-gray-500 text-center px-8">
          Novos prêmios serão adicionados em breve!
        </Text>
      </View>
    );
  };

  if (isLoading && rewards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando prêmios...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={rewards}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4">
            <RewardCard
              reward={item}
              userBalance={userBalance}
              onPress={() => handleClaim(item.id)}
              onClaim={() => handleClaim(item.id)}
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

      {/* Modal de Resgate */}
      <RewardClaimModal
        reward={selectedReward}
        isOpen={isModalOpen}
        userBalance={userBalance}
        onClose={handleModalClose}
        onSuccess={handleClaimSuccess}
      />
    </View>
  );
}
