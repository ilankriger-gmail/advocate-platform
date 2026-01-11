'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { getRewardById, updateReward } from '@/actions/rewards-admin';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditRewardPage({ params }: PageProps) {
  const router = useRouter();
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          type: result.data.type,
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

    if (!formData.name || !formData.coins_cost) {
      setError('Nome e custo em coracoes sao obrigatorios');
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <option value="physical">Fisico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a recompensa..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo (coracoes) *</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="h-24 w-auto rounded-lg object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              {isSaving ? 'Salvando...' : 'Salvar Alteracoes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
