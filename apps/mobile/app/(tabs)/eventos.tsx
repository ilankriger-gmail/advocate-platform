import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { eventsApi } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  is_online: boolean;
  max_participants: number | null;
  participants_count: number;
  is_active: boolean;
}

export default function EventosScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await eventsApi.getAll();

      if (result.data) {
        setEvents(result.data as Event[]);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    fetchEvents(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEventCard = ({ item }: { item: Event }) => (
    <TouchableOpacity
      className="mx-4 mb-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
      activeOpacity={0.8}
    >
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <View className={`px-2 py-1 rounded-full ${item.is_online ? 'bg-blue-100' : 'bg-green-100'}`}>
            <Text className={`text-xs font-medium ${item.is_online ? 'text-blue-700' : 'text-green-700'}`}>
              {item.is_online ? 'Online' : 'Presencial'}
            </Text>
          </View>
          {item.max_participants && (
            <Text className="text-gray-500 text-xs ml-2">
              {item.participants_count}/{item.max_participants} participantes
            </Text>
          )}
        </View>

        <Text className="text-gray-900 font-semibold text-lg mb-1">
          {item.title}
        </Text>

        {item.description && (
          <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">📅</Text>
          <Text className="text-gray-700 text-sm font-medium">
            {formatDate(item.starts_at)}
          </Text>
        </View>

        {item.location && !item.is_online && (
          <View className="flex-row items-center mt-2">
            <Text className="text-2xl mr-2">📍</Text>
            <Text className="text-gray-600 text-sm" numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-6xl mb-4">📅</Text>
        <Text className="text-gray-900 font-semibold text-lg mb-2">
          Nenhum evento disponível
        </Text>
        <Text className="text-gray-500 text-center px-8">
          Novos eventos serão anunciados em breve!
        </Text>
      </View>
    );
  };

  if (isLoading && events.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text className="text-gray-500 mt-4">Carregando eventos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderEventCard}
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
