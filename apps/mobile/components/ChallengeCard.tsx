import { View, Text, Image, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
  thumbnail_url?: string | null;
  prize_amount: number | null;
  num_winners: number | null;
  record_video_url?: string | null;
  instagram_embed_url?: string | null;
  participants_count: number;
  user_participation: {
    status: string;
    result_value: number | null;
    coins_earned: number | null;
  } | null;
  has_participated: boolean;
}

interface ChallengeCardProps {
  challenge: Challenge;
  onPress?: () => void;
  onParticipate?: () => void;
  style?: StyleProp<ViewStyle>;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  engajamento: { label: 'Engajamento', color: 'bg-blue-100 text-blue-700' },
  fisico: { label: 'Físico', color: 'bg-green-100 text-green-700' },
  atos_amor: { label: 'Atos de Amor', color: 'bg-pink-100 text-pink-700' },
  participe: { label: 'Participe', color: 'bg-purple-100 text-purple-700' },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
}

function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ChallengeCard({ challenge, onPress, onParticipate, style }: ChallengeCardProps) {
  const typeInfo = TYPE_LABELS[challenge.type] || { label: challenge.type, color: 'bg-gray-100 text-gray-700' };
  const daysLeft = getDaysLeft(challenge.ends_at);
  const imageUrl = challenge.thumbnail_url || challenge.image_url;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden border border-gray-100"
      activeOpacity={0.7}
      style={style}
    >
      {/* Image */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-40 bg-gray-100"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className={`px-3 py-1 rounded-full ${typeInfo.color.split(' ')[0]}`}>
            <Text className={`text-xs font-medium ${typeInfo.color.split(' ')[1]}`}>
              {typeInfo.label}
            </Text>
          </View>
          {daysLeft !== null && daysLeft > 0 && (
            <View className="flex-row items-center">
              <FontAwesome name="clock-o" size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1">
                {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
              </Text>
            </View>
          )}
        </View>

        {/* Title & Description */}
        <Text className="font-bold text-gray-900 text-lg mb-1">
          {challenge.title}
        </Text>
        <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
          {challenge.description}
        </Text>

        {/* Prize Info */}
        <View className="flex-row items-center mb-3 flex-wrap gap-3">
          {challenge.coins_reward > 0 && (
            <View className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-full">
              <Text className="text-lg mr-1">❤️</Text>
              <Text className="text-red-600 font-semibold">
                {challenge.coins_reward} corações
              </Text>
            </View>
          )}
          {challenge.prize_amount && challenge.prize_amount > 0 && (
            <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
              <Text className="text-lg mr-1">💰</Text>
              <Text className="text-green-600 font-semibold">
                R$ {challenge.prize_amount}
              </Text>
            </View>
          )}
        </View>

        {/* Hashtag */}
        {challenge.hashtag && (
          <View className="flex-row items-center mb-3">
            <FontAwesome name="hashtag" size={12} color="#8B5CF6" />
            <Text className="text-primary-600 text-sm ml-1">
              {challenge.hashtag}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View className="flex-row items-center">
            <FontAwesome name="users" size={14} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-2">
              {challenge.participants_count} participante{challenge.participants_count !== 1 ? 's' : ''}
            </Text>
          </View>

          {challenge.has_participated ? (
            <View className="flex-row items-center bg-green-100 px-3 py-2 rounded-full">
              <FontAwesome name="check" size={12} color="#059669" />
              <Text className="text-green-700 font-medium text-sm ml-1">
                Participando
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onParticipate?.();
              }}
              className="bg-primary-600 px-4 py-2 rounded-full"
            >
              <Text className="text-white font-semibold text-sm">
                Participar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
