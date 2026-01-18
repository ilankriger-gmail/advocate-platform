import { View, Text, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

interface MyClaimCardProps {
  claim: Claim;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Aguardando',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    icon: 'clock-o' as const,
  },
  processing: {
    label: 'Em Processo',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: 'spinner' as const,
  },
  completed: {
    label: 'Entregue',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'check-circle' as const,
  },
  cancelled: {
    label: 'Cancelado',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'times-circle' as const,
  },
};

const TYPE_ICONS: Record<string, string> = {
  digital: '🎁',
  physical: '📦',
  money: '💵',
};

export default function MyClaimCard({ claim }: MyClaimCardProps) {
  const statusConfig = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
  const typeIcon = TYPE_ICONS[claim.reward.type] || '🎁';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View className={`bg-white rounded-2xl border ${statusConfig.borderColor} shadow-sm overflow-hidden`}>
      <View className="flex-row p-3">
        {/* Imagem ou ícone */}
        {claim.reward.image_url ? (
          <Image
            source={{ uri: claim.reward.image_url }}
            className="w-16 h-16 rounded-xl bg-gray-100"
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
            <Text className="text-3xl">{typeIcon}</Text>
          </View>
        )}

        {/* Conteúdo */}
        <View className="flex-1 ml-3">
          <Text className="text-gray-900 font-semibold" numberOfLines={1}>
            {claim.reward.name}
          </Text>

          {claim.selected_option && (
            <Text className="text-gray-500 text-xs mt-0.5">
              Opção: {claim.selected_option}
            </Text>
          )}

          <View className="flex-row items-center gap-2 mt-2">
            {/* Status badge */}
            <View className={`flex-row items-center px-2 py-1 rounded-full ${statusConfig.bgColor}`}>
              <FontAwesome name={statusConfig.icon} size={10} color={statusConfig.textColor.replace('text-', '')} />
              <Text className={`text-xs font-medium ml-1 ${statusConfig.textColor}`}>
                {statusConfig.label}
              </Text>
            </View>

            {/* Data */}
            <Text className="text-xs text-gray-400">
              {formatDate(claim.created_at)}
            </Text>
          </View>
        </View>

        {/* Corações gastos */}
        <View className="items-end justify-center">
          <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-lg">
            <Text className="text-sm mr-1">❤️</Text>
            <Text className="text-red-600 font-bold text-sm">
              -{claim.coins_spent}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
