import { View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_online: boolean;
  online_url?: string | null;
  max_participants: number | null;
  participants_count: number;
  is_active: boolean;
  is_live?: boolean;
  is_registered?: boolean;
  is_full?: boolean;
  can_register?: boolean;
}

interface EventCardProps {
  event: Event;
  onPress?: () => void;
  onRegister?: () => void;
  onCancel?: () => void;
  onJoinNow?: () => void;
  compact?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeUntil(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return 'Agora';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `em ${days}d`;
  if (hours > 0) return `em ${hours}h`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `em ${minutes}min`;
}

export default function EventCard({
  event,
  onPress,
  onRegister,
  onCancel,
  onJoinNow,
  compact = false,
}: EventCardProps) {
  const handleJoinNow = () => {
    if (event.online_url) {
      Linking.openURL(event.online_url);
    }
    onJoinNow?.();
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
      >
        <View className="flex-row items-center">
          {event.image_url ? (
            <Image
              source={{ uri: event.image_url }}
              className="w-16 h-16 rounded-lg bg-gray-100"
              resizeMode="cover"
            />
          ) : (
            <View className="w-16 h-16 rounded-lg bg-primary-100 items-center justify-center">
              <Text className="text-3xl">📅</Text>
            </View>
          )}

          <View className="flex-1 ml-3">
            <View className="flex-row items-center gap-2">
              {event.is_live && (
                <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center">
                  <View className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                  <Text className="text-white text-[10px] font-bold">AO VIVO</Text>
                </View>
              )}
              <View className={`px-2 py-0.5 rounded-full ${event.is_online ? 'bg-blue-100' : 'bg-green-100'}`}>
                <Text className={`text-[10px] font-medium ${event.is_online ? 'text-blue-700' : 'text-green-700'}`}>
                  {event.is_online ? 'Online' : 'Presencial'}
                </Text>
              </View>
            </View>

            <Text className="text-gray-900 font-semibold mt-1" numberOfLines={1}>
              {event.title}
            </Text>

            <Text className="text-gray-500 text-xs mt-0.5">
              {event.is_live ? 'Acontecendo agora!' : getTimeUntil(event.starts_at)}
            </Text>
          </View>

          {event.is_live && event.is_online && event.is_registered && (
            <TouchableOpacity
              onPress={handleJoinNow}
              className="bg-red-500 px-3 py-2 rounded-lg"
            >
              <Text className="text-white font-bold text-xs">ENTRAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
    >
      {/* Image with Live Badge */}
      <View className="relative">
        {event.image_url ? (
          <Image
            source={{ uri: event.image_url }}
            className="w-full h-40"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-40 bg-gradient-to-br from-primary-400 to-accent-400 items-center justify-center">
            <Text className="text-6xl">📅</Text>
          </View>
        )}

        {/* Live Badge */}
        {event.is_live && (
          <View className="absolute top-3 left-3 bg-red-500 px-3 py-1.5 rounded-full flex-row items-center shadow-lg">
            <View className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            <Text className="text-white text-sm font-bold">AO VIVO</Text>
          </View>
        )}

        {/* Registered Badge */}
        {event.is_registered && !event.is_live && (
          <View className="absolute top-3 right-3 bg-green-500 px-3 py-1.5 rounded-full flex-row items-center">
            <FontAwesome name="check" size={10} color="#fff" />
            <Text className="text-white text-xs font-bold ml-1">INSCRITO</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        {/* Tags */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className={`px-2 py-1 rounded-full ${event.is_online ? 'bg-blue-100' : 'bg-green-100'}`}>
            <Text className={`text-xs font-medium ${event.is_online ? 'text-blue-700' : 'text-green-700'}`}>
              {event.is_online ? '💻 Online' : '📍 Presencial'}
            </Text>
          </View>

          {event.max_participants && (
            <View className={`px-2 py-1 rounded-full ${event.is_full ? 'bg-red-100' : 'bg-gray-100'}`}>
              <Text className={`text-xs font-medium ${event.is_full ? 'text-red-700' : 'text-gray-700'}`}>
                {event.participants_count}/{event.max_participants} vagas
              </Text>
            </View>
          )}

          {!event.max_participants && (
            <View className="px-2 py-1 rounded-full bg-gray-100">
              <Text className="text-xs font-medium text-gray-700">
                {event.participants_count} participantes
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text className="text-gray-900 font-bold text-lg mb-1">
          {event.title}
        </Text>

        {/* Description */}
        {event.description && (
          <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* Date & Location */}
        <View className="space-y-2">
          <View className="flex-row items-center">
            <FontAwesome name="calendar" size={14} color="#6B7280" />
            <Text className="text-gray-700 text-sm font-medium ml-2">
              {formatDate(event.starts_at)}
            </Text>
            {!event.is_live && (
              <Text className="text-primary-600 text-xs ml-2">
                ({getTimeUntil(event.starts_at)})
              </Text>
            )}
          </View>

          {event.location && !event.is_online && (
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={14} color="#6B7280" />
              <Text className="text-gray-600 text-sm ml-2" numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        <View className="mt-4">
          {event.is_live && event.is_online && event.is_registered ? (
            <TouchableOpacity
              onPress={handleJoinNow}
              className="bg-red-500 py-3 rounded-xl flex-row items-center justify-center"
            >
              <FontAwesome name="play-circle" size={18} color="#fff" />
              <Text className="text-white font-bold ml-2">Entrar Agora</Text>
            </TouchableOpacity>
          ) : event.is_registered ? (
            <View className="flex-row gap-2">
              <View className="flex-1 bg-green-100 py-3 rounded-xl flex-row items-center justify-center">
                <FontAwesome name="check-circle" size={16} color="#059669" />
                <Text className="text-green-700 font-semibold ml-2">Inscrito</Text>
              </View>
              {!event.is_live && (
                <TouchableOpacity
                  onPress={onCancel}
                  className="px-4 py-3 bg-gray-100 rounded-xl"
                >
                  <FontAwesome name="times" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          ) : event.is_full ? (
            <View className="bg-gray-100 py-3 rounded-xl items-center">
              <Text className="text-gray-500 font-semibold">Evento Lotado</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onRegister}
              className="bg-primary-600 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Quero Participar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
