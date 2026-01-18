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
  Image,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { rewardsApi } from '@/lib/api';

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

interface RewardClaimModalProps {
  reward: Reward | null;
  isOpen: boolean;
  userBalance: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalStage = 'details' | 'form' | 'loading' | 'success';
type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

const PIX_KEY_TYPES: { key: PixKeyType; label: string }[] = [
  { key: 'cpf', label: 'CPF' },
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'random', label: 'Chave Aleatória' },
];

export default function RewardClaimModal({
  reward,
  isOpen,
  userBalance,
  onClose,
  onSuccess,
}: RewardClaimModalProps) {
  const [stage, setStage] = useState<ModalStage>('details');
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    pixKey: '',
    pixKeyType: 'cpf' as PixKeyType,
  });

  if (!reward) return null;

  const canAfford = userBalance >= reward.coins_required;
  const hasOptions = reward.available_options && reward.available_options.length > 0;
  const needsForm = reward.type === 'physical' || reward.type === 'money';

  const resetAndClose = () => {
    setStage('details');
    setError(null);
    setSelectedOption(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      pixKey: '',
      pixKeyType: 'cpf',
    });
    onClose();
  };

  const handleContinue = () => {
    if (hasOptions && !selectedOption) {
      setError('Selecione uma opção');
      return;
    }
    setError(null);

    if (needsForm) {
      setStage('form');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError(null);

    // Validar formulário para prêmios físicos
    if (reward.type === 'physical') {
      if (!formData.name || !formData.address || !formData.city ||
          !formData.state || !formData.zipCode || !formData.phone) {
        setError('Preencha todos os campos de endereço');
        return;
      }
    }

    // Validar formulário para prêmios em dinheiro
    if (reward.type === 'money') {
      if (!formData.pixKey) {
        setError('Informe sua chave PIX');
        return;
      }
    }

    setStage('loading');

    try {
      const deliveryInfo = needsForm ? {
        name: formData.name || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        phone: formData.phone || undefined,
        pixKey: formData.pixKey || undefined,
        pixKeyType: formData.pixKeyType,
      } : undefined;

      const response = await rewardsApi.claim({
        rewardId: reward.id,
        selectedOption: selectedOption || undefined,
        deliveryInfo,
      });

      if (response.error) {
        setError(response.error);
        setStage(needsForm ? 'form' : 'details');
        return;
      }

      setStage('success');
    } catch {
      setError('Erro ao processar resgate. Tente novamente.');
      setStage(needsForm ? 'form' : 'details');
    }
  };

  const handleSuccessClose = () => {
    resetAndClose();
    onSuccess?.();
  };

  // Tela de detalhes do prêmio
  const renderDetails = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Imagem */}
      {reward.image_url && (
        <Image
          source={{ uri: reward.image_url }}
          className="w-full h-48 rounded-xl mb-4"
          resizeMode="cover"
        />
      )}

      {/* Nome e descrição */}
      <Text className="text-gray-900 font-bold text-xl mb-2">{reward.name}</Text>
      <Text className="text-gray-600 text-base mb-4">{reward.description}</Text>

      {/* Custo */}
      <View className="flex-row items-center bg-red-50 px-4 py-3 rounded-xl mb-4">
        <Text className="text-2xl mr-2">❤️</Text>
        <Text className="text-red-600 font-bold text-xl">{reward.coins_required}</Text>
        <Text className="text-red-600 ml-1">corações</Text>
      </View>

      {/* Saldo do usuário */}
      <View className="flex-row items-center justify-between bg-gray-50 px-4 py-3 rounded-xl mb-4">
        <Text className="text-gray-600">Seu saldo:</Text>
        <View className="flex-row items-center">
          <Text className="text-lg mr-1">❤️</Text>
          <Text className={`font-bold text-lg ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
            {userBalance}
          </Text>
        </View>
      </View>

      {/* Aviso de saldo insuficiente */}
      {!canAfford && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <FontAwesome name="exclamation-triangle" size={16} color="#DC2626" />
            <Text className="text-red-700 ml-2 flex-1">
              Você precisa de mais {reward.coins_required - userBalance} corações para resgatar este prêmio.
            </Text>
          </View>
        </View>
      )}

      {/* Opções (se houver) */}
      {hasOptions && (
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-3">Selecione uma opção:</Text>
          <View className="space-y-2">
            {reward.available_options?.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSelectedOption(option)}
                className={`p-4 rounded-xl border ${
                  selectedOption === option
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <View className="flex-row items-center">
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                    selectedOption === option
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedOption === option && (
                      <FontAwesome name="check" size={10} color="#fff" />
                    )}
                  </View>
                  <Text className={`${selectedOption === option ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
                    {option}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
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
          <Text className="text-gray-700 font-semibold text-center">Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!canAfford}
          className={`flex-1 py-3 rounded-xl ${canAfford ? 'bg-primary-600' : 'bg-gray-300'}`}
        >
          <Text className={`font-semibold text-center ${canAfford ? 'text-white' : 'text-gray-500'}`}>
            {needsForm ? 'Continuar' : 'Resgatar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Formulário de entrega/PIX
  const renderForm = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={() => setStage('details')}
        className="flex-row items-center mb-4"
      >
        <FontAwesome name="arrow-left" size={16} color="#6B7280" />
        <Text className="text-gray-600 ml-2">Voltar</Text>
      </TouchableOpacity>

      {reward.type === 'physical' && (
        <>
          <Text className="text-gray-900 font-bold text-lg mb-4">Endereço de Entrega</Text>

          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Nome completo *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Seu nome completo"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Endereço *</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => setFormData({ ...formData, address: text })}
                placeholder="Rua, número, complemento"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Cidade *</Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Cidade"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="w-24">
                <Text className="text-sm font-medium text-gray-700 mb-1">UF *</Text>
                <TextInput
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                  placeholder="UF"
                  maxLength={2}
                  autoCapitalize="characters"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">CEP *</Text>
                <TextInput
                  value={formData.zipCode}
                  onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                  placeholder="00000-000"
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">Telefone *</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>
        </>
      )}

      {reward.type === 'money' && (
        <>
          <Text className="text-gray-900 font-bold text-lg mb-4">Dados para PIX</Text>

          <View className="space-y-3">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Tipo da chave</Text>
              <View className="flex-row flex-wrap gap-2">
                {PIX_KEY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    onPress={() => setFormData({ ...formData, pixKeyType: type.key })}
                    className={`px-4 py-2 rounded-full ${
                      formData.pixKeyType === type.key
                        ? 'bg-primary-600'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text className={`font-medium ${
                      formData.pixKeyType === type.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Chave PIX *</Text>
              <TextInput
                value={formData.pixKey}
                onChangeText={(text) => setFormData({ ...formData, pixKey: text })}
                placeholder={
                  formData.pixKeyType === 'cpf' ? '000.000.000-00' :
                  formData.pixKeyType === 'phone' ? '(00) 00000-0000' :
                  formData.pixKeyType === 'email' ? 'seu@email.com' :
                  'Chave aleatória'
                }
                keyboardType={
                  formData.pixKeyType === 'email' ? 'email-address' :
                  formData.pixKeyType === 'phone' || formData.pixKeyType === 'cpf' ? 'numeric' :
                  'default'
                }
                autoCapitalize="none"
                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View className="bg-green-50 border border-green-200 rounded-xl p-4">
              <View className="flex-row items-start">
                <Text className="text-xl mr-2">💵</Text>
                <View className="flex-1">
                  <Text className="text-green-800 font-semibold">PIX será enviado em até 48h</Text>
                  <Text className="text-green-700 text-sm mt-1">
                    Após a confirmação do resgate, o valor será transferido para a chave informada.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Erro */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
          <Text className="text-red-700 text-sm">{error}</Text>
        </View>
      )}

      {/* Botão */}
      <TouchableOpacity
        onPress={handleSubmit}
        className="bg-primary-600 py-4 rounded-xl mt-6"
      >
        <Text className="text-white font-bold text-center text-lg">Confirmar Resgate</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Tela de carregamento
  const renderLoading = () => (
    <View className="py-12 items-center">
      <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-6">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
        Processando resgate...
      </Text>
      <Text className="text-gray-500 text-center px-6">
        Aguarde enquanto confirmamos seu resgate.
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
        Resgate Confirmado!
      </Text>
      <Text className="text-gray-500 text-center px-6 mb-6">
        {reward.type === 'money'
          ? 'O PIX será enviado para sua chave em até 48 horas.'
          : reward.type === 'physical'
          ? 'Seu prêmio será enviado para o endereço informado.'
          : 'Você receberá as instruções para resgatar seu prêmio.'}
      </Text>

      <View className="bg-primary-50 rounded-xl p-4 mx-4 mb-6 w-full">
        <View className="flex-row items-center justify-between">
          <Text className="text-primary-600">Corações debitados:</Text>
          <View className="flex-row items-center">
            <Text className="text-lg mr-1">❤️</Text>
            <Text className="text-primary-600 font-bold">-{reward.coins_required}</Text>
          </View>
        </View>
      </View>

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-gray-900">
            {stage === 'loading' ? 'Processando...' :
             stage === 'success' ? 'Sucesso!' :
             stage === 'form' ? 'Informações' :
             'Resgatar Prêmio'}
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
          {stage === 'details' && renderDetails()}
          {stage === 'form' && renderForm()}
          {stage === 'loading' && renderLoading()}
          {stage === 'success' && renderSuccess()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
