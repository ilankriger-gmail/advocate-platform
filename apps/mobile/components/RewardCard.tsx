import { View, Text, Image, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

interface RewardCardProps {
  reward: Reward;
  userBalance: number;
  onPress?: () => void;
  onClaim?: () => void;
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  digital: { label: 'Digital', icon: '🎁' },
  physical: { label: 'Físico', icon: '📦' },
  money: { label: 'Dinheiro', icon: '💰' },
};

export default function RewardCard({ reward, userBalance, onPress, onClaim }: RewardCardProps) {
  const typeInfo = TYPE_LABELS[reward.type] || { label: reward.type, icon: '🎁' };
  const progress = Math.min((userBalance / reward.coins_required) * 100, 100);
  const canClaim = reward.can_claim && reward.has_stock;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100"
      activeOpacity={0.7}
    >
      {/* Image */}
      {reward.image_url ? (
        <Image
          source={{ uri: reward.image_url }}
          className="w-full h-36 bg-gray-100"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-36 bg-gradient-to-br from-primary-100 to-accent-100 items-center justify-center">
          <Text className="text-5xl">{typeInfo.icon}</Text>
        </View>
      )}

      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <Text className="mr-1">{typeInfo.icon}</Text>
            <Text className="text-gray-500 text-xs font-medium">
              {typeInfo.label}
            </Text>
          </View>
          {!reward.has_stock && (
            <View className="bg-red-100 px-2 py-1 rounded-full">
              <Text className="text-red-600 text-xs font-medium">
                Esgotado
              </Text>
            </View>
          )}
        </View>

        {/* Name & Description */}
        <Text className="font-bold text-gray-900 text-lg mb-1">
          {reward.name}
        </Text>
        <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
          {reward.description}
        </Text>

        {/* Price */}
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center bg-red-50 px-3 py-2 rounded-xl">
            <Text className="text-xl mr-2">❤️</Text>
            <Text className="text-red-600 font-bold text-lg">
              {reward.coins_required}
            </Text>
            <Text className="text-red-500 ml-1">corações</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {!canClaim && reward.has_stock && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500 text-xs">Seu progresso</Text>
              <Text className="text-gray-700 text-xs font-medium">
                {userBalance} / {reward.coins_required}
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </View>
            <Text className="text-gray-500 text-xs mt-1">
              Faltam {reward.coins_required - userBalance} corações
            </Text>
          </View>
        )}

        {/* Stock info */}
        {reward.quantity_available !== null && reward.quantity_available > 0 && (
          <View className="flex-row items-center mb-3">
            <FontAwesome name="cube" size={12} color="#9CA3AF" />
            <Text className="text-gray-500 text-xs ml-1">
              {reward.quantity_available} disponíveis
            </Text>
          </View>
        )}

        {/* Claim Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onClaim?.();
          }}
          disabled={!canClaim}
          className={`py-3 rounded-xl items-center ${
            canClaim
              ? 'bg-primary-600'
              : 'bg-gray-200'
          }`}
        >
          <Text
            className={`font-semibold ${
              canClaim ? 'text-white' : 'text-gray-500'
            }`}
          >
            {!reward.has_stock
              ? 'Esgotado'
              : canClaim
              ? 'Resgatar'
              : 'Corações insuficientes'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
