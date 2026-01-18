import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

interface MyParticipationCardProps {
  participation: Participation;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Aguardando',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300',
    icon: 'clock-o' as const,
  },
  approved: {
    label: 'Aprovado',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300',
    icon: 'check-circle' as const,
  },
  rejected: {
    label: 'Rejeitado',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300',
    icon: 'times-circle' as const,
  },
};

export default function MyParticipationCard({ participation, onPress }: MyParticipationCardProps) {
  const statusConfig = STATUS_CONFIG[participation.status];
  const challenge = participation.challenge;

  const formatResultValue = () => {
    if (!participation.result_value) return null;

    if (challenge.goal_type === 'time') {
      const minutes = Math.floor(participation.result_value / 60);
      const seconds = participation.result_value % 60;
      return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    }

    return `${participation.result_value} rep`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`bg-white rounded-2xl border ${statusConfig.borderColor} shadow-sm overflow-hidden`}
    >
      <View className="p-4">
        <View className="flex-row items-center">
          {/* Ícone do desafio */}
          <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
            <Text className="text-2xl">{challenge.icon || '🎯'}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-base" numberOfLines={1}>
              {challenge.title}
            </Text>

            <View className="flex-row items-center gap-2 mt-1">
              {/* Status badge */}
              <View className={`flex-row items-center px-2 py-0.5 rounded-full ${statusConfig.bgColor}`}>
                <FontAwesome name={statusConfig.icon} size={10} color={statusConfig.textColor.replace('text-', '')} />
                <Text className={`text-xs font-medium ml-1 ${statusConfig.textColor}`}>
                  {statusConfig.label}
                </Text>
              </View>

              {/* Resultado (se houver) */}
              {formatResultValue() && (
                <View className="flex-row items-center px-2 py-0.5 rounded-full bg-blue-100">
                  <Text className="text-xs font-medium text-blue-700">
                    {formatResultValue()}
                  </Text>
                </View>
              )}

              {/* Data */}
              <Text className="text-xs text-gray-400">
                {formatDate(participation.created_at)}
              </Text>
            </View>
          </View>

          {/* Corações ganhos */}
          {participation.status === 'approved' && participation.coins_earned && participation.coins_earned > 0 && (
            <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-xl">
              <Text className="text-lg mr-1">❤️</Text>
              <Text className="text-green-600 font-bold text-lg">
                +{participation.coins_earned}
              </Text>
            </View>
          )}

          {/* Indicador de pendente */}
          {participation.status === 'pending' && (
            <View className="flex-row items-center bg-yellow-50 px-3 py-2 rounded-xl">
              <FontAwesome name="hourglass-half" size={16} color="#D97706" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
