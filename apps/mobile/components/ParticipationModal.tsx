import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { challengesApi } from '@/lib/api';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  coins_reward: number;
  goal_type: string | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
}

interface ParticipationModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStage = 'form' | 'loading' | 'success';

// Validar URL do YouTube (não aceita Shorts)
function isValidYouTubeUrl(url: string): boolean {
  if (/youtube\.com\/shorts\//i.test(url)) {
    return false;
  }
  return /youtube\.com\/watch|youtu\.be\//.test(url);
}

// Verificar se é URL de Shorts
function isYouTubeShorts(url: string): boolean {
  return /youtube\.com\/shorts\//i.test(url);
}

// Validar URL do Instagram
function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|reels)\//.test(url);
}

export default function ParticipationModal({
  challenge,
  isOpen,
  onClose,
  onSuccess,
}: ParticipationModalProps) {
  const [stage, setStage] = useState<ModalStage>('form');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    resultValue: '',
    videoUrl: '',
    instagramUrl: '',
  });

  if (!challenge) return null;

  const isAtosAmor = challenge.type === 'atos_amor';
  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repetições';

  const resetAndClose = () => {
    setStage('form');
    setError(null);
    setFormData({ resultValue: '', videoUrl: '', instagramUrl: '' });
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    // Validar resultado para desafios físicos
    let resultValue = 1;
    if (!isAtosAmor) {
      resultValue = parseInt(formData.resultValue, 10);
      if (isNaN(resultValue) || resultValue <= 0) {
        setError('Informe um valor válido');
        return;
      }
    }

    // Validar YouTube
    if (!formData.videoUrl) {
      setError('Link do vídeo do YouTube é obrigatório');
      return;
    }

    if (isYouTubeShorts(formData.videoUrl)) {
      setError('YouTube Shorts não é aceito! Envie um vídeo completo.');
      return;
    }

    if (!isValidYouTubeUrl(formData.videoUrl)) {
      setError('Apenas links do YouTube são aceitos. O vídeo deve ser público.');
      return;
    }

    // Validar Instagram para Atos de Amor
    if (isAtosAmor) {
      if (!formData.instagramUrl) {
        setError('Link do Instagram é obrigatório para Atos de Amor');
        return;
      }
      if (!isValidInstagramUrl(formData.instagramUrl)) {
        setError('Link do Instagram inválido. Use instagram.com/p/... ou /reel/...');
        return;
      }
    }

    setStage('loading');

    try {
      const response = await challengesApi.participate({
        challengeId: challenge.id,
        resultValue,
        videoProofUrl: formData.videoUrl,
        instagramProofUrl: isAtosAmor ? formData.instagramUrl : undefined,
      });

      if (response.error) {
        setError(response.error);
        setStage('form');
        return;
      }

      setStage('success');
    } catch {
      setError('Erro ao enviar participação. Tente novamente.');
      setStage('form');
    }
  };

  const handleSuccessClose = () => {
    resetAndClose();
    onSuccess?.();
  };

  // Tela de carregamento
  const renderLoading = () => (
    <View className="py-12 items-center">
      <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        Enviando participação...
      </Text>
      <Text className="text-gray-500 text-center px-6">
        Aguarde enquanto registramos sua participação.
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
        Participação Enviada!
      </Text>
      <Text className="text-gray-500 text-center px-6 mb-6">
        Sua participação foi registrada e está aguardando análise. Você será notificado quando houver uma atualização.
      </Text>

      <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mx-4 mb-6">
        <View className="flex-row items-start">
          <Text className="text-xl mr-3">⏳</Text>
          <View className="flex-1">
            <Text className="font-semibold text-yellow-800">Aguardando Análise</Text>
            <Text className="text-sm text-yellow-700 mt-1">
              Nossa equipe irá revisar seu vídeo em breve. Os corações serão creditados após a aprovação.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSuccessClose}
        className="bg-primary-600 px-8 py-3 rounded-full"
      >
        <Text className="text-white font-semibold text-base">
          Fechar
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Tela do formulário
  const renderForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Info do desafio */}
      <View className="bg-primary-50 rounded-xl p-4 mb-4">
        <Text className="font-bold text-primary-900 text-lg">{challenge.title}</Text>
        {challenge.goal_value && !isAtosAmor && (
          <Text className="text-sm text-primary-700 mt-1">
            Meta: {challenge.goal_value} {goalLabel}
          </Text>
        )}
        <View className="flex-row items-center mt-2">
          <Text className="text-lg mr-1">❤️</Text>
          <Text className="text-primary-600 font-semibold">
            {challenge.coins_reward} corações
          </Text>
        </View>
      </View>

      {/* Hashtag e perfil */}
      {(challenge.hashtag || challenge.profile_to_tag) && (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          {challenge.hashtag && (
            <View className="flex-row items-center mb-2">
              <FontAwesome name="hashtag" size={14} color="#8B5CF6" />
              <Text className="text-primary-600 ml-2">{challenge.hashtag}</Text>
            </View>
          )}
          {challenge.profile_to_tag && (
            <View className="flex-row items-center">
              <FontAwesome name="at" size={14} color="#8B5CF6" />
              <Text className="text-primary-600 ml-2">{challenge.profile_to_tag}</Text>
            </View>
          )}
        </View>
      )}

      {/* Resultado (apenas para desafios físicos) */}
      {!isAtosAmor && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Seu resultado ({goalLabel}) *
          </Text>
          <TextInput
            value={formData.resultValue}
            onChangeText={(text) => setFormData({ ...formData, resultValue: text })}
            placeholder={`Ex: ${challenge.goal_value || 50}`}
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      {/* Link do YouTube */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Link do vídeo no YouTube *
        </Text>
        <TextInput
          value={formData.videoUrl}
          onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
          placeholder="https://youtube.com/watch?v=..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
          placeholderTextColor="#9CA3AF"
        />

        {/* Aviso de Shorts */}
        {formData.videoUrl && isYouTubeShorts(formData.videoUrl) && (
          <View className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <Text className="text-xs text-red-700 font-medium">
              ❌ YouTube Shorts não é aceito! Envie um vídeo completo.
            </Text>
          </View>
        )}

        {/* Regras do vídeo */}
        <View className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <Text className="text-xs text-yellow-800 font-medium mb-1">
            ⚠️ Regras do vídeo:
          </Text>
          <Text className="text-xs text-yellow-700">
            • Deve ser PÚBLICO no YouTube{'\n'}
            • NÃO aceitamos YouTube Shorts{'\n'}
            • Grave com BOA ILUMINAÇÃO
          </Text>
        </View>
      </View>

      {/* Link do Instagram (apenas para Atos de Amor) */}
      {isAtosAmor && (
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Link do post/reel no Instagram *
          </Text>
          <TextInput
            value={formData.instagramUrl}
            onChangeText={(text) => setFormData({ ...formData, instagramUrl: text })}
            placeholder="https://instagram.com/p/... ou /reel/..."
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
          <View className="mt-2 bg-pink-50 border border-pink-200 rounded-lg p-3">
            <Text className="text-xs text-pink-800">
              📸 Compartilhe seu ato de amor no Instagram também! Poste ou faça um reel público.
            </Text>
          </View>
        </View>
      )}

      {/* Erro */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {/* Botões */}
      <View className="flex-row gap-3 mt-2">
        <TouchableOpacity
          onPress={resetAndClose}
          className="flex-1 bg-gray-100 py-3 rounded-xl"
        >
          <Text className="text-gray-700 font-semibold text-center">
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          className="flex-1 bg-primary-600 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold text-center">
            Enviar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={stage === 'loading' ? undefined : resetAndClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">
            {stage === 'loading' ? 'Enviando...' : stage === 'success' ? 'Sucesso!' : 'Participar do Desafio'}
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
          {stage === 'form' && renderForm()}
          {stage === 'loading' && renderLoading()}
          {stage === 'success' && renderSuccess()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
