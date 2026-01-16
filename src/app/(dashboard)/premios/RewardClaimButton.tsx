'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { claimReward, type DeliveryAddress, type PixData } from '@/actions/rewards';
import { X, MapPin, Loader2, CheckCircle, Search, AlertCircle, Banknote, Clock } from 'lucide-react';

interface RewardClaimButtonProps {
  reward: {
    id: string;
    name: string;
    type: 'digital' | 'physical' | 'money';
    coins_required: number;
    available_options?: {
      colors?: string[];
      sizes?: string[];
    } | null;
  };
  canClaim: boolean;
  userName?: string;  // Nome do usuário para pré-preencher destinatário
  userBalance?: number;  // Saldo atual de corações do usuário
}

export function RewardClaimButton({ reward, canClaim, userName = '', userBalance = 0 }: RewardClaimButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estado do endereço e seleções (pré-preenche nome do destinatário)
  const [address, setAddress] = useState<DeliveryAddress>({
    recipient_name: userName,
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    size: '',
    color: '',
  });

  // Estados para controle de busca de CEP
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [cepError, setCepError] = useState(false);

  // Estado para dados do PIX
  const [pixData, setPixData] = useState<PixData>({
    recipient_name: userName,
    pix_key_type: 'cpf',
    pix_key: '',
  });

  const isPhysical = reward.type === 'physical';
  const isMoney = reward.type === 'money';
  const hasColors = reward.available_options?.colors && reward.available_options.colors.length > 0;
  const hasSizes = reward.available_options?.sizes && reward.available_options.sizes.length > 0;

  // Buscar endereço pelo CEP
  const fetchAddress = useCallback(async (cep: string) => {
    setIsFetchingCep(true);
    setCepError(false);
    setCepFound(false);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError(true);
        // Limpar campos se CEP inválido
        setAddress((prev) => ({
          ...prev,
          street: '',
          neighborhood: '',
          city: '',
          state: '',
        }));
      } else {
        setCepFound(true);
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || '',
        }));
      }
    } catch {
      setCepError(true);
    } finally {
      setIsFetchingCep(false);
    }
  }, []);

  // Buscar automaticamente quando CEP tiver 8 dígitos
  useEffect(() => {
    const cepNumbers = address.cep.replace(/\D/g, '');
    if (cepNumbers.length === 8) {
      fetchAddress(cepNumbers);
    } else {
      // Reset estados se CEP incompleto
      setCepFound(false);
      setCepError(false);
    }
  }, [address.cep, fetchAddress]);

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Lidar com clique no botão de resgatar
  const handleClaimClick = () => {
    if (isPhysical || isMoney) {
      setIsModalOpen(true);
    } else {
      handleClaim();
    }
  };

  // Processar resgate
  const handleClaim = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await claimReward(
        reward.id,
        isPhysical ? address : undefined,
        isMoney ? pixData : undefined
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSuccess(false);
          router.refresh();
        }, 2000);
      }
    } catch {
      setError('Erro ao processar resgate');
    } finally {
      setIsLoading(false);
    }
  };

  // Validar formulário de endereço
  const isAddressValid =
    address.recipient_name.trim() !== '' &&
    address.cep.replace(/\D/g, '').length === 8 &&
    address.street.trim() !== '' &&
    address.number.trim() !== '' &&
    address.neighborhood.trim() !== '' &&
    address.city.trim() !== '' &&
    address.state.trim() !== '' &&
    // Tamanho obrigatório se houver opções
    (!hasSizes || address.size?.trim() !== '') &&
    // Cor obrigatória se houver opções
    (!hasColors || address.color?.trim() !== '');

  // Validar formulário de PIX
  const isPixValid =
    pixData.recipient_name.trim() !== '' &&
    pixData.pix_key_type !== undefined &&
    pixData.pix_key.trim() !== '';

  // Formatar CPF
  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Lidar com mudança da chave PIX
  const handlePixKeyChange = (value: string) => {
    let formattedValue = value;
    if (pixData.pix_key_type === 'cpf') {
      formattedValue = formatCpf(value);
    } else if (pixData.pix_key_type === 'phone') {
      formattedValue = formatPhone(value);
    }
    setPixData({ ...pixData, pix_key: formattedValue });
  };

  // Limpar chave PIX ao mudar o tipo
  const handlePixKeyTypeChange = (type: PixData['pix_key_type']) => {
    setPixData({ ...pixData, pix_key_type: type, pix_key: '' });
  };

  // Placeholder baseado no tipo de chave
  const getPixKeyPlaceholder = () => {
    switch (pixData.pix_key_type) {
      case 'cpf': return '000.000.000-00';
      case 'email': return 'seu@email.com';
      case 'phone': return '(00) 00000-0000';
      case 'random': return 'Cole sua chave aleatória';
      default: return '';
    }
  };

  // Max length baseado no tipo de chave
  const getPixKeyMaxLength = () => {
    switch (pixData.pix_key_type) {
      case 'cpf': return 14;
      case 'phone': return 15;
      default: return 100;
    }
  };

  return (
    <>
      <button
        onClick={handleClaimClick}
        disabled={!canClaim || isLoading}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          canClaim
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? '...' : canClaim ? '✓ Resgatar' : 'Resgatar'}
      </button>

      {/* Modal de Endereço ou PIX */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !isLoading && setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl ${isMoney ? 'bg-gradient-to-r from-green-50 to-emerald-50' : ''}`}>
              <div className="flex items-center gap-2">
                {isMoney ? (
                  <Banknote className="w-5 h-5 text-green-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-amber-500" />
                )}
                <h2 className="text-lg font-semibold">
                  {isMoney ? 'Dados para PIX' : 'Endereço de Entrega'}
                </h2>
              </div>
              <button
                onClick={() => !isLoading && setIsModalOpen(false)}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sucesso */}
            {success ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Resgate Confirmado!
                </h3>
                <p className="text-gray-600">
                  {isMoney
                    ? 'Seu PIX será enviado em até 48 horas para a chave informada.'
                    : 'Seu prêmio será enviado para o endereço informado.'}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Info do prêmio */}
                <div className={`p-3 rounded-lg ${isMoney ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <p className={`text-sm font-medium ${isMoney ? 'text-green-800' : 'text-amber-800'}`}>
                    {isMoney ? '💰' : '🎁'} Prêmio: {reward.name}
                  </p>
                  <p className={`text-xs mt-1 ${isMoney ? 'text-green-700' : 'text-amber-700'}`}>
                    Parabéns por chegar até aqui! Sua dedicação está sendo recompensada.
                  </p>
                </div>

                {/* Aviso de prazo para PIX */}
                {isMoney && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Prazo de até 48 horas
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        O depósito via PIX pode levar até 48 horas úteis para ser processado após a aprovação do resgate.
                      </p>
                    </div>
                  </div>
                )}

                {/* Resumo de corações */}
                <div className="p-4 bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Seu saldo atual</span>
                    <span className="font-bold text-gray-900">{userBalance} ❤️</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Custo deste prêmio</span>
                    <span className="font-bold text-red-600">-{reward.coins_required} ❤️</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-pink-200">
                    <span className="text-sm font-medium text-gray-700">Saldo após resgate</span>
                    <span className="font-bold text-green-600">{userBalance - reward.coins_required} ❤️</span>
                  </div>
                </div>

                {/* Formulário de PIX para prêmios em dinheiro */}
                {isMoney && (
                  <div className="space-y-4">
                    {/* Nome do titular */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome completo do titular da conta *
                      </label>
                      <Input
                        value={pixData.recipient_name}
                        onChange={(e) =>
                          setPixData({ ...pixData, recipient_name: e.target.value })
                        }
                        placeholder="Nome como está no banco"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Deve ser o mesmo nome registrado na conta PIX
                      </p>
                    </div>

                    {/* Tipo de chave PIX */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de chave PIX *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'cpf', label: 'CPF' },
                          { value: 'email', label: 'E-mail' },
                          { value: 'phone', label: 'Telefone' },
                          { value: 'random', label: 'Chave aleatória' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handlePixKeyTypeChange(option.value as PixData['pix_key_type'])}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              pixData.pix_key_type === option.value
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chave PIX */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chave PIX *
                      </label>
                      <Input
                        value={pixData.pix_key}
                        onChange={(e) => handlePixKeyChange(e.target.value)}
                        placeholder={getPixKeyPlaceholder()}
                        maxLength={getPixKeyMaxLength()}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {pixData.pix_key_type === 'cpf' && 'Digite apenas os números do CPF'}
                        {pixData.pix_key_type === 'email' && 'Digite o e-mail cadastrado no PIX'}
                        {pixData.pix_key_type === 'phone' && 'Digite DDD + número (ex: 11999999999)'}
                        {pixData.pix_key_type === 'random' && 'Cole a chave aleatória gerada pelo seu banco'}
                      </p>
                    </div>

                    {/* Aviso importante */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <strong>Importante:</strong> Confira os dados antes de confirmar. O PIX será enviado para a chave informada e não poderá ser alterado após a confirmação.
                      </p>
                    </div>
                  </div>
                )}

                {/* Seleção de Cor e Tamanho (apenas para físicos) */}
                {isPhysical && (hasColors || hasSizes) && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Escolha suas opções:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Cor */}
                      {hasColors && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cor *
                          </label>
                          <select
                            value={address.color || ''}
                            onChange={(e) => setAddress({ ...address, color: e.target.value })}
                            disabled={isLoading}
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                          >
                            <option value="">Selecione</option>
                            {reward.available_options?.colors?.map((color) => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Tamanho */}
                      {hasSizes && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamanho *
                          </label>
                          <select
                            value={address.size || ''}
                            onChange={(e) => setAddress({ ...address, size: e.target.value })}
                            disabled={isLoading}
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
                          >
                            <option value="">Selecione</option>
                            {reward.available_options?.sizes?.map((size) => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Formulário de endereço (apenas para físicos) */}
                {isPhysical && (
                <div className="space-y-4">
                  {/* Nome do destinatário */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome de quem vai receber *
                    </label>
                    <Input
                      value={address.recipient_name}
                      onChange={(e) =>
                        setAddress({ ...address, recipient_name: e.target.value })
                      }
                      placeholder="Nome completo do destinatário"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Pode ser você ou outra pessoa
                    </p>
                  </div>

                  {/* CEP com feedback visual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <div className="relative">
                      <Input
                        value={address.cep}
                        onChange={(e) =>
                          setAddress({ ...address, cep: formatCep(e.target.value) })
                        }
                        placeholder="00000-000"
                        maxLength={9}
                        disabled={isLoading}
                        className={`pr-10 ${cepError ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500' : ''} ${cepFound ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : ''}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isFetchingCep && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                        {cepFound && !isFetchingCep && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {cepError && !isFetchingCep && <AlertCircle className="w-5 h-5 text-amber-500" />}
                        {!isFetchingCep && !cepFound && !cepError && address.cep.length < 9 && (
                          <Search className="w-5 h-5 text-gray-300" />
                        )}
                      </div>
                    </div>
                    {cepError && (
                      <p className="text-xs text-amber-600 mt-1">CEP não encontrado na base. Preencha o endereço manualmente abaixo.</p>
                    )}
                    {!cepFound && !cepError && !isFetchingCep && (
                      <p className="text-xs text-gray-500 mt-1">Digite o CEP para buscar o endereço automaticamente</p>
                    )}
                  </div>

                  {/* Número e Complemento - campos que o usuário preenche */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <Input
                        value={address.number}
                        onChange={(e) =>
                          setAddress({ ...address, number: e.target.value })
                        }
                        placeholder="123"
                        disabled={isLoading}
                        autoFocus={cepFound}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <Input
                        value={address.complement}
                        onChange={(e) =>
                          setAddress({ ...address, complement: e.target.value })
                        }
                        placeholder="Apto, bloco..."
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Campos auto-preenchidos - aparecem após busca do CEP */}
                  {cepFound && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Endereço encontrado
                      </p>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Rua:</span>
                          <span className="text-gray-900 font-medium text-right">{address.street || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bairro:</span>
                          <span className="text-gray-900 font-medium">{address.neighborhood || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cidade:</span>
                          <span className="text-gray-900 font-medium">{address.city} - {address.state}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos manuais caso CEP não encontre ou dê erro */}
                  {!cepFound && address.cep.replace(/\D/g, '').length === 8 && !isFetchingCep && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                        <Input
                          value={address.street}
                          onChange={(e) => setAddress({ ...address, street: e.target.value })}
                          placeholder="Nome da rua"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                        <Input
                          value={address.neighborhood}
                          onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                          placeholder="Nome do bairro"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                          <Input
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            placeholder="Cidade"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                          <Input
                            value={address.state}
                            onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase().slice(0, 2) })}
                            placeholder="UF"
                            maxLength={2}
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Erro */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleClaim}
                    disabled={isLoading || (isMoney ? !isPixValid : !isAddressValid)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      isMoney
                        ? `Solicitar PIX (${reward.coins_required} ❤️)`
                        : `Confirmar Resgate (${reward.coins_required} ❤️)`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
