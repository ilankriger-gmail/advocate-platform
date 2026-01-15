'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getRewardById, updateReward, generateRewardThumbnailAction, uploadRewardImage, generateRewardDescriptionAction } from '@/actions/rewards-admin';
import { fetchProductDetails } from '@/actions/shop-import';
import { RewardImageUploader } from '@/components/RewardImageUploader';
import Link from 'next/link';
import { Sparkles, Loader2, Store } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRewardPage({ params }: PageProps) {
  const router = useRouter();
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isLoadingShopDetails, setIsLoadingShopDetails] = useState(false);
  const [isUnlimited, setIsUnlimited] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [shopDetails, setShopDetails] = useState<{
    sizes: string[];
    colors: Array<{ name: string; hex: string }>;
    description: string;
    materials: string[];
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins_required: '',
    stock: '',
    type: 'digital' as 'digital' | 'physical' | 'money',
    image_url: '',
    is_active: true,
  });

  // Resolver params e carregar dados
  useEffect(() => {
    async function loadReward() {
      const resolvedParams = await params;
      setRewardId(resolvedParams.id);

      const result = await getRewardById(resolvedParams.id);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.data) {
        setFormData({
          name: result.data.name,
          description: result.data.description || '',
          coins_required: result.data.coins_required.toString(),
          stock: result.data.quantity_available?.toString() || '',
          type: result.data.type || 'digital',
          image_url: result.data.image_url || '',
          is_active: result.data.is_active,
        });
        // Definir se é ilimitado baseado no estoque
        setIsUnlimited(!result.data.quantity_available);
      }

      setIsLoading(false);
    }

    loadReward();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.name || !formData.coins_required) {
      setError('Nome e custo em corações são obrigatórios');
      return;
    }

    if (!rewardId) return;

    setIsSaving(true);

    let finalImageUrl = formData.image_url || null;

    // Se tem nova imagem selecionada, faz upload
    if (newImageBase64) {
      const uploadResult = await uploadRewardImage(rewardId, newImageBase64);
      if (uploadResult.error) {
        setError(`Erro no upload da imagem: ${uploadResult.error}`);
        setIsSaving(false);
        return;
      }
      finalImageUrl = uploadResult.data?.url || null;
    }

    const result = await updateReward(rewardId, {
      name: formData.name,
      description: formData.description || null,
      coins_required: parseInt(formData.coins_required),
      quantity_available: formData.stock ? parseInt(formData.stock) : null,
      type: formData.type,
      image_url: finalImageUrl,
      is_active: formData.is_active,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push('/admin/premios');
  };

  // Gerar imagem com IA
  const handleGenerateAI = async () => {
    if (!rewardId || !formData.name) {
      setError('Preencha o nome do prêmio primeiro');
      return;
    }

    setIsGeneratingAI(true);
    setError(null);
    setSuccessMessage(null);

    const result = await generateRewardThumbnailAction(rewardId, {
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      coins_required: parseInt(formData.coins_required) || 100,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data?.url) {
      setFormData({ ...formData, image_url: result.data.url });
      setNewImageBase64(null); // Limpa imagem pendente pois IA já salvou
      setSuccessMessage('Imagem gerada com sucesso!');
    }

    setIsGeneratingAI(false);
  };

  // Callback quando imagem é alterada no uploader
  const handleImageChange = (base64: string | null) => {
    setNewImageBase64(base64);
    // Se removeu a imagem, limpa também a URL atual
    if (base64 === null) {
      setFormData({ ...formData, image_url: '' });
    }
  };

  // Extrair URL da Uma Penca da descrição
  const umaPencaUrl = formData.description?.match(/https:\/\/umapenca\.com[^\s]*/)?.[0];

  // Buscar detalhes do produto da loja
  const handleFetchShopDetails = async () => {
    if (!umaPencaUrl) return;

    setIsLoadingShopDetails(true);
    setError(null);

    const result = await fetchProductDetails(umaPencaUrl);

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setShopDetails(result.data);
      setSuccessMessage('Detalhes carregados da loja!');
    }

    setIsLoadingShopDetails(false);
  };

  // Gerar descrição com IA
  const handleGenerateDescription = async () => {
    if (!formData.name) {
      setError('Preencha o nome do prêmio primeiro');
      return;
    }

    setIsGeneratingDesc(true);
    setError(null);

    const result = await generateRewardDescriptionAction({
      name: formData.name,
      type: formData.type,
      shopDetails: shopDetails ? {
        colors: shopDetails.colors.map(c => c.name),
        sizes: shopDetails.sizes,
        materials: shopDetails.materials,
      } : undefined,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.description) {
      setFormData({ ...formData, description: result.description });
      setSuccessMessage('Descrição gerada com sucesso!');
    }

    setIsGeneratingDesc(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/admin/premios">
          <Button variant="outline">Voltar</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Prêmio</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize os dados do prêmio</p>
        </div>
        <Link href="/admin/premios">
          <Button variant="outline">Cancelar</Button>
        </Link>
      </div>

      <Card className="p-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome e Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Camiseta Exclusiva"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'digital' | 'physical' | 'money' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="digital">Digital</option>
                <option value="physical">Físico</option>
                <option value="money">PIX / Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <div className="flex gap-2">
                {umaPencaUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFetchShopDetails}
                    disabled={isLoadingShopDetails}
                    className="text-xs h-7"
                  >
                    {isLoadingShopDetails ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Store className="w-3 h-3 mr-1" />
                        Buscar da Loja
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc || !formData.name}
                  className="text-xs h-7 border-purple-300 text-purple-600 hover:bg-purple-50"
                  title="Gerar descrição com IA"
                >
                  {isGeneratingDesc ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      IA
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o prêmio..."
              rows={3}
            />
            {formData.type === 'physical' && (
              <p className="text-xs text-amber-600 mt-1">
                * Prêmios físicos exigirão endereço de entrega no momento do resgate
              </p>
            )}

            {/* Detalhes da Loja */}
            {shopDetails && (
              <div className="mt-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Detalhes do Produto
                </h4>

                {/* Cores */}
                {shopDetails.colors.length > 0 && (
                  <div className="mb-3">
                    <label className="text-xs text-purple-600 font-medium">Cores disponíveis</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {shopDetails.colors.map((color) => (
                        <div key={color.hex} className="flex items-center gap-1 bg-white px-2 py-1 rounded border">
                          <span
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-xs text-gray-700">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tamanhos */}
                {shopDetails.sizes.length > 0 && (
                  <div className="mb-3">
                    <label className="text-xs text-purple-600 font-medium">Tamanhos</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shopDetails.sizes.map((size) => (
                        <span key={size} className="px-2 py-0.5 bg-white border rounded text-xs font-medium text-gray-700">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materiais */}
                {shopDetails.materials.length > 0 && (
                  <div>
                    <label className="text-xs text-purple-600 font-medium">Material</label>
                    <p className="text-xs text-gray-600 mt-1">{shopDetails.materials.join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Custo, Estoque e Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo (corações) *</label>
              <Input
                type="number"
                value={formData.coins_required}
                onChange={(e) => setFormData({ ...formData, coins_required: e.target.value })}
                onFocus={(e) => e.target.select()}
                placeholder="100"
                min="1"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Estoque</label>
                <button
                  type="button"
                  onClick={() => {
                    const newUnlimited = !isUnlimited;
                    setIsUnlimited(newUnlimited);
                    if (newUnlimited) {
                      setFormData({ ...formData, stock: '' });
                    }
                  }}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isUnlimited
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isUnlimited ? '∞ Ilimitado' : 'Limitado'}
                </button>
              </div>
              {isUnlimited ? (
                <div className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-center text-purple-700 text-sm font-medium">
                  Estoque Ilimitado
                </div>
              ) : (
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  onFocus={(e) => e.target.select()}
                  placeholder="Quantidade"
                  min="1"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Oculto</option>
              </select>
            </div>
          </div>

          {/* Imagem */}
          <div className="space-y-3">
            <RewardImageUploader
              currentUrl={formData.image_url || null}
              onImageChange={handleImageChange}
              disabled={isSaving}
            />

            {/* Botão Gerar com IA */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateAI}
              disabled={isGeneratingAI || isSaving || !formData.name}
              className="w-full border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Imagem com IA
                </>
              )}
            </Button>

            {/* Informação sobre série limitada para físicos */}
            {formData.type === 'physical' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 font-medium">
                  Série Limitada
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Este é um prêmio físico de série limitada. O usuário precisará fornecer seu endereço completo para receber em casa.
                </p>
              </div>
            )}
          </div>

          {/* Mensagens de erro e sucesso */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4">
            <Link href="/admin/premios" className="flex-1">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                className="w-full"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
