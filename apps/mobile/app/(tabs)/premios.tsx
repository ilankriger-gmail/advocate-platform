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
import RewardCard from '@/components/RewardCard';
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

const TYPE_OPTIONS: { key: RewardType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'digital', label: '🎁 Digital' },
  { key: 'physical', label: '📦 Físico' },
  { key: 'money', label: '💰 Dinheiro' },
];

export default function PremiosScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [type, setType] = useState<RewardType>('all');

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

      const result = await rewardsApi.getAll(params);

      if (result.data) {
        const response = result.data as RewardsResponse;
        setRewards(response.rewards);
        setUserBalance(response.user_balance);
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
    // TODO: Abrir modal de resgate
    console.log('Resgatar prêmio:', rewardId);
  };

  const renderHeader = () => (
    <View className="pb-4">
      {/* Balance Card */}
      <View className="mx-4 mb-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-5">
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
              onPress={() => {
                // TODO: Navegar para detalhe do prêmio
              }}
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
    </View>
  );
}
