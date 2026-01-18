import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import EventCard from '@/components/EventCard';
import EventRegistrationModal from '@/components/EventRegistrationModal';
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
  online_url?: string | null;
  max_participants: number | null;
  participants_count: number;
  is_active: boolean;
  is_live?: boolean;
  is_registered?: boolean;
  is_full?: boolean;
  can_register?: boolean;
}

interface Registration {
  id: string;
  status: string;
  created_at: string;
  event: {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    starts_at: string;
    ends_at: string | null;
    location: string | null;
    is_online: boolean;
    online_url: string | null;
    is_active: boolean;
    is_live?: boolean;
    is_past?: boolean;
    is_upcoming?: boolean;
  };
}

interface EventsResponse {
  events: Event[];
}

interface RegistrationsResponse {
  registrations: Registration[];
}

export default function EventosScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllRegistrations, setShowAllRegistrations] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [eventsResult, registrationsResult] = await Promise.all([
        eventsApi.getAll(),
        eventsApi.getMyRegistrations(),
      ]);

      if (eventsResult.data) {
        const response = eventsResult.data as EventsResponse;
        setEvents(response.events || []);
      }

      if (registrationsResult.data) {
        const response = registrationsResult.data as RegistrationsResponse;
        setMyRegistrations(response.registrations || []);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleRegister = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCancelRegistration = async (eventId: string) => {
    Alert.alert(
      'Cancelar Inscrição',
      'Tem certeza que deseja cancelar sua inscrição neste evento?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await eventsApi.cancelRegistration(eventId);
              if (result.error) {
                Alert.alert('Erro', result.error);
              } else {
                fetchData(true);
              }
            } catch {
              Alert.alert('Erro', 'Erro ao cancelar inscrição');
            }
          },
        },
      ]
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleRegistrationSuccess = () => {
    fetchData(true);
  };

  // Separar eventos
  const liveEvents = events.filter(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live);

  // Separar registros
  const upcomingRegistrations = myRegistrations.filter(r => r.event?.is_upcoming);
  const pastRegistrations = myRegistrations.filter(r => r.event?.is_past);
  const displayedRegistrations = showAllRegistrations
    ? upcomingRegistrations
    : upcomingRegistrations.slice(0, 2);

  const renderHeader = () => (
    <View className="space-y-4 pb-4">
      {/* Acontecendo Agora */}
      {liveEvents.length > 0 && (
        <View className="px-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-3 h-3 bg-red-500 rounded-full" />
            <Text className="text-gray-900 font-bold text-lg">Acontecendo Agora</Text>
          </View>

          {liveEvents.map((event) => (
            <View key={event.id} className="mb-3">
              <EventCard
                event={event}
                onPress={() => handleRegister(event)}
                onRegister={() => handleRegister(event)}
                onCancel={() => handleCancelRegistration(event.id)}
              />
            </View>
          ))}
        </View>
      )}

      {/* Meus Próximos Eventos */}
      {upcomingRegistrations.length > 0 && (
        <View className="px-4 space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                <FontAwesome name="calendar-check-o" size={18} color="#059669" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-lg">Meus Próximos Eventos</Text>
                <Text className="text-gray-500 text-xs">Eventos que você está inscrito</Text>
              </View>
            </View>
            {upcomingRegistrations.length > 2 && (
              <TouchableOpacity
                onPress={() => setShowAllRegistrations(!showAllRegistrations)}
                className="px-3 py-1.5 bg-gray-100 rounded-full"
              >
                <Text className="text-gray-600 text-xs font-medium">
                  {showAllRegistrations ? 'Ver menos' : `Ver todos (${upcomingRegistrations.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="space-y-2">
            {displayedRegistrations.map((reg) => (
              <EventCard
                key={reg.id}
                event={{
                  ...reg.event,
                  participants_count: 0,
                  max_participants: null,
                  is_active: true,
                  is_registered: true,
                } as Event}
                compact
                onCancel={() => handleCancelRegistration(reg.event.id)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Título da seção de próximos eventos */}
      {upcomingEvents.length > 0 && (
        <View className="px-4 pt-2">
          <Text className="text-gray-900 font-bold text-lg mb-1">Próximos Eventos</Text>
          <Text className="text-gray-500 text-sm">Confira os eventos que estão por vir</Text>
        </View>
      )}
    </View>
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
        data={upcomingEvents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View className="px-4 mb-4">
            <EventCard
              event={item}
              onPress={() => handleRegister(item)}
              onRegister={() => handleRegister(item)}
              onCancel={() => handleCancelRegistration(item.id)}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={liveEvents.length === 0 ? renderEmpty : null}
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

      {/* Modal de Inscrição */}
      <EventRegistrationModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleRegistrationSuccess}
      />
    </View>
  );
}
