'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { claimReward, type DeliveryAddress } from '@/actions/rewards';
import { X, MapPin, Loader2, CheckCircle } from 'lucide-react';

interface RewardClaimButtonProps {
  reward: {
    id: string;
    name: string;
    type: 'digital' | 'physical';
    coins_required: number;
    available_options?: {
      colors?: string[];
      sizes?: string[];
    } | null;
  };
  canClaim: boolean;
  userName?: string;  // Nome do usuário para pré-preencher destinatário
}

export function RewardClaimButton({ reward, canClaim, userName = '' }: RewardClaimButtonProps) {
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

  const isPhysical = reward.type === 'physical';
  const hasColors = reward.available_options?.colors && reward.available_options.colors.length > 0;
  const hasSizes = reward.available_options?.sizes && reward.available_options.sizes.length > 0;

  // Buscar endereço pelo CEP
  const handleCepBlur = async () => {
    const cep = address.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setAddress((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {
      // Ignorar erro de busca de CEP
    }
  };

  // Formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Lidar com clique no botão de resgatar
  const handleClaimClick = () => {
    if (isPhysical) {
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
        isPhysical ? address : undefined
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

      {/* Modal de Endereço */}
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
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Endereço de Entrega</h2>
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
                  Seu prêmio será enviado para o endereço informado.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {/* Info do prêmio */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">
                    Prêmio: {reward.name}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Parabéns por chegar até aqui! Sua dedicação está sendo recompensada. Escolha as opções e informe onde deseja receber.
                  </p>
                </div>

                {/* Seleção de Cor e Tamanho */}
                {(hasColors || hasSizes) && (
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

                {/* Formulário de endereço */}
                <div className="space-y-3">
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
                      Pode ser você ou outra pessoa (ex: enviar para casa de um familiar)
                    </p>
                  </div>

                  {/* CEP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CEP *
                    </label>
                    <Input
                      value={address.cep}
                      onChange={(e) =>
                        setAddress({ ...address, cep: formatCep(e.target.value) })
                      }
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Rua */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rua *
                    </label>
                    <Input
                      value={address.street}
                      onChange={(e) =>
                        setAddress({ ...address, street: e.target.value })
                      }
                      placeholder="Nome da rua"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Número e Complemento */}
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

                  {/* Bairro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bairro *
                    </label>
                    <Input
                      value={address.neighborhood}
                      onChange={(e) =>
                        setAddress({ ...address, neighborhood: e.target.value })
                      }
                      placeholder="Nome do bairro"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Cidade e Estado */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <Input
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        placeholder="Cidade"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                      </label>
                      <Input
                        value={address.state}
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            state: e.target.value.toUpperCase().slice(0, 2),
                          })
                        }
                        placeholder="UF"
                        maxLength={2}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

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
                    disabled={isLoading || !isAddressValid}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      `Confirmar Resgate (${reward.coins_required} ❤️)`
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
