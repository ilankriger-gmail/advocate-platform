import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
}

interface EventRegistrationModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStage = 'confirm' | 'loading' | 'success';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventRegistrationModal({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EventRegistrationModalProps) {
  const [stage, setStage] = useState<ModalStage>('confirm');
  const [error, setError] = useState<string | null>(null);

  if (!event) return null;

  const remainingSpots = event.max_participants
    ? event.max_participants - event.participants_count
    : null;

  const resetAndClose = () => {
    setStage('confirm');
    setError(null);
    onClose();
  };

  const handleRegister = async () => {
    setError(null);
    setStage('loading');

    try {
      const result = await eventsApi.register(event.id);

      if (result.error) {
        setError(result.error);
        setStage('confirm');
        return;
      }

      setStage('success');
    } catch {
      setError('Erro ao processar inscrição. Tente novamente.');
      setStage('confirm');
    }
  };

  const handleSuccessClose = () => {
    resetAndClose();
    onSuccess?.();
  };

  // Tela de confirmação
  const renderConfirm = () => (
    <View>
      {/* Imagem do evento */}
      {event.image_url && (
        <Image
          source={{ uri: event.image_url }}
          className="w-full h-40 rounded-xl mb-4"
          resizeMode="cover"
        />
      )}

      {/* Título */}
      <Text className="text-gray-900 font-bold text-xl mb-2">{event.title}</Text>

      {/* Info */}
      <View className="space-y-3 mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-primary-100 rounded-xl items-center justify-center">
            <FontAwesome name="calendar" size={18} color="#8B5CF6" />
          </View>
          <Text className="text-gray-700 ml-3 flex-1">{formatDate(event.starts_at)}</Text>
        </View>

        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-primary-100 rounded-xl items-center justify-center">
            <FontAwesome name={event.is_online ? 'laptop' : 'map-marker'} size={18} color="#8B5CF6" />
          </View>
          <Text className="text-gray-700 ml-3 flex-1">
            {event.is_online ? 'Evento Online' : event.location || 'Local a definir'}
          </Text>
        </View>

        {remainingSpots !== null && (
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary-100 rounded-xl items-center justify-center">
              <FontAwesome name="users" size={16} color="#8B5CF6" />
            </View>
            <Text className={`ml-3 ${remainingSpots <= 5 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
              {remainingSpots <= 5 ? `Apenas ${remainingSpots} vagas restantes!` : `${remainingSpots} vagas disponíveis`}
            </Text>
          </View>
        )}
      </View>

      {/* Descrição */}
      {event.description && (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-600 text-sm leading-5">{event.description}</Text>
        </View>
      )}

      {/* Erro */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {/* Botões */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={resetAndClose}
          className="flex-1 bg-gray-100 py-3 rounded-xl"
        >
          <Text className="text-gray-700 font-semibold text-center">Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleRegister}
          className="flex-1 bg-primary-600 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-center">Confirmar Inscrição</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tela de carregamento
  const renderLoading = () => (
    <View className="py-12 items-center">
      <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        Processando inscrição...
      </Text>
      <Text className="text-gray-500 text-center px-6">
        Aguarde enquanto confirmamos sua participação.
      </Text>
    </View>
  );

  // Tela de sucesso
  const renderSuccess = () => (
    <View className="py-8 items-center">
      <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
        <FontAwesome name="check" size={40} color="#059669" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        Inscrição Confirmada!
      </Text>
      <Text className="text-gray-500 text-center px-6 mb-6">
        Você está inscrito no evento "{event.title}". Não se esqueça da data!
      </Text>

      <View className="bg-primary-50 rounded-xl p-4 w-full mb-6">
        <View className="flex-row items-center">
          <FontAwesome name="calendar-check-o" size={20} color="#8B5CF6" />
          <Text className="text-primary-700 font-medium ml-3">
            {formatDate(event.starts_at)}
          </Text>
        </View>
      </View>

      {event.is_online && (
        <View className="bg-blue-50 rounded-xl p-4 w-full mb-6">
          <View className="flex-row items-start">
            <FontAwesome name="info-circle" size={16} color="#3B82F6" />
            <Text className="text-blue-700 text-sm ml-2 flex-1">
              O link para entrar no evento estará disponível no dia do evento.
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSuccessClose}
        className="bg-primary-600 px-8 py-3 rounded-full"
      >
        <Text className="text-white font-semibold text-base">Fechar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={stage === 'loading' ? undefined : resetAndClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">
            {stage === 'loading' ? 'Processando...' :
             stage === 'success' ? 'Sucesso!' :
             'Inscrever-se no Evento'}
          </Text>
          {stage !== 'loading' && (
            <TouchableOpacity
              onPress={stage === 'success' ? handleSuccessClose : resetAndClose}
              className="p-2"
            >
              <FontAwesome name="times" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 px-4 py-4">
          {stage === 'confirm' && renderConfirm()}
          {stage === 'loading' && renderLoading()}
          {stage === 'success' && renderSuccess()}
        </View>
      </View>
    </Modal>
  );
}
