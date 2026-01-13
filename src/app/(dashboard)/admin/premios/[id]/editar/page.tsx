'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getRewardById, updateReward, generateRewardThumbnailAction, uploadRewardImage } from '@/actions/rewards-admin';
import Link from 'next/link';
import { Upload, Sparkles, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRewardPage({ params }: PageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins_cost: '',
    stock: '',
    type: 'digital' as 'digital' | 'physical',
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
          coins_cost: result.data.coins_cost.toString(),
          stock: result.data.stock?.toString() || '',
          type: result.data.type || 'digital',
          image_url: result.data.image_url || '',
          is_active: result.data.is_active,
        });
      }

      setIsLoading(false);
    }

    loadReward();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.name || !formData.coins_cost) {
      setError('Nome e custo em corações são obrigatórios');
      return;
    }

    if (!rewardId) return;

    setIsSaving(true);

    const result = await updateReward(rewardId, {
      name: formData.name,
      description: formData.description || null,
      coins_cost: parseInt(formData.coins_cost),
      stock: formData.stock ? parseInt(formData.stock) : null,
      type: formData.type,
      image_url: formData.image_url || null,
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
      coins_cost: parseInt(formData.coins_cost) || 100,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data?.url) {
      setFormData({ ...formData, image_url: result.data.url });
      setSuccessMessage('Imagem gerada com sucesso!');
    }

    setIsGeneratingAI(false);
  };

  // Upload de imagem
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !rewardId) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    setSuccessMessage(null);

    // Converter para base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      const result = await uploadRewardImage(rewardId, base64);

      if (result.error) {
        setError(result.error);
      } else if (result.data?.url) {
        setFormData({ ...formData, image_url: result.data.url });
        setSuccessMessage('Imagem enviada com sucesso!');
      }

      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setError('Erro ao ler arquivo');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
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
          <h1 className="text-2xl font-bold text-gray-900">Editar Recompensa</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize os dados da recompensa</p>
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
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'digital' | 'physical' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="digital">Digital</option>
                <option value="physical">Físico</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a recompensa..."
              rows={3}
            />
            {formData.type === 'physical' && (
              <p className="text-xs text-amber-600 mt-1">
                * Prêmios físicos exigirão endereço de entrega no momento do resgate
              </p>
            )}
          </div>

          {/* Custo, Estoque e Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo (corações) *</label>
              <Input
                type="number"
                value={formData.coins_cost}
                onChange={(e) => setFormData({ ...formData, coins_cost: e.target.value })}
                placeholder="100"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                placeholder="Ilimitado"
                min="0"
              />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do Prêmio</label>

            {/* Preview da imagem */}
            {formData.image_url ? (
              <div className="relative mb-3">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={(e) => (e.currentTarget.src = '/placeholder-reward.png')}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mb-3 w-full h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma imagem</p>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3">
              {/* Upload de imagem */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || isGeneratingAI}
                className="flex-1"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar Imagem
                  </>
                )}
              </Button>

              {/* Gerar com IA */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI || isUploadingImage || !formData.name}
                className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Use IA para gerar uma imagem automaticamente ou envie sua própria imagem (máx 5MB).
            </p>

            {/* Informação sobre série limitada para físicos */}
            {formData.type === 'physical' && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
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
