'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { toggleRewardActive, createReward, approveClaim, markClaimShipped, markClaimDelivered, uploadRewardImageToStorage } from '@/actions/rewards-admin';
import { RewardImageUploader } from '@/components/RewardImageUploader';
import { Pencil } from 'lucide-react';

interface RewardActionsProps {
  reward: {
    id: string;
    name: string;
    is_active: boolean;
  };
}

export function RewardActions({ reward }: RewardActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const result = await toggleRewardActive(reward.id, !reward.is_active);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      <Link href={`/admin/premios/${reward.id}/editar`}>
        <Button
          size="sm"
          variant="outline"
          className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
        >
          <Pencil className="w-3 h-3 mr-1" />
          Editar
        </Button>
      </Link>
      <Link href={`/lp/premio/${reward.id}`} target="_blank">
        <Button
          size="sm"
          variant="outline"
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Button>
      </Link>
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        size="sm"
        variant="outline"
        className={reward.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
      >
        {isLoading ? '...' : reward.is_active ? 'Ocultar' : 'Ativar'}
      </Button>
    </div>
  );
}

interface ClaimActionsProps {
  claim: {
    id: string;
    status: string;
  };
}

export function ClaimActions({ claim }: ClaimActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveClaim(claim.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleShip = async () => {
    setIsLoading(true);
    const result = await markClaimShipped(claim.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleDeliver = async () => {
    setIsLoading(true);
    const result = await markClaimDelivered(claim.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  if (claim.status === 'pending') {
    return (
      <Button
        onClick={handleApprove}
        disabled={isLoading}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        {isLoading ? '...' : 'Aprovar'}
      </Button>
    );
  }

  if (claim.status === 'approved') {
    return (
      <Button
        onClick={handleShip}
        disabled={isLoading}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? '...' : 'Marcar Enviado'}
      </Button>
    );
  }

  if (claim.status === 'shipped') {
    return (
      <Button
        onClick={handleDeliver}
        disabled={isLoading}
        size="sm"
        className="bg-purple-600 hover:bg-purple-700"
      >
        {isLoading ? '...' : 'Confirmar Entrega'}
      </Button>
    );
  }

  return null;
}

export function NewRewardForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [moneyValue, setMoneyValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins_required: '',
    stock: '',
    type: 'digital' as 'digital' | 'physical' | 'money',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.coins_required) {
      setError('Nome e custo em corações são obrigatórios');
      return;
    }

    setIsLoading(true);

    let imageUrl: string | null = null;

    // Se tem imagem, faz upload primeiro
    if (imageBase64) {
      const uploadResult = await uploadRewardImageToStorage(imageBase64);
      if (uploadResult.error) {
        setError(`Erro no upload da imagem: ${uploadResult.error}`);
        setIsLoading(false);
        return;
      }
      imageUrl = uploadResult.data?.url || null;
    }

    const result = await createReward({
      name: formData.name,
      description: formData.description || null,
      coins_required: parseInt(formData.coins_required),
      quantity_available: formData.type === 'money' ? null : (formData.stock ? parseInt(formData.stock) : null),
      type: formData.type,
      image_url: imageUrl,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setFormData({
      name: '',
      description: '',
      coins_required: '',
      stock: '',
      type: 'digital',
    });
    setImageBase64(null);
    setIsOpen(false);
    router.refresh();
    setIsLoading(false);
  };

  const openWithPixTemplate = () => {
    setFormData({
      name: 'PIX R$ 50',
      description: 'Resgate seu premio em PIX! O valor sera transferido para sua chave PIX apos aprovacao. Informe sua chave PIX (CPF, email, telefone ou chave aleatoria) no momento do resgate.',
      coins_required: '500',
      stock: '',
      type: 'money',
    });
    setMoneyValue('50');
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <Card className="p-5">
        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-2xl">+</span>
            <span>Criar Nova Recompensa</span>
          </button>
          <button
            onClick={openWithPixTemplate}
            className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-green-500/25 transition-all flex items-center gap-2"
          >
            <span className="text-xl">💸</span>
            <span>+ Novo PIX</span>
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="font-bold text-gray-900 mb-4">Nova Recompensa</h2>

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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'digital' | 'physical' | 'money' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="digital">Digital</option>
              <option value="physical">Fisico</option>
              <option value="money">PIX / Dinheiro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva a recompensa..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              onFocus={(e) => e.target.select()}
              placeholder="Ilimitado"
              min="0"
            />
          </div>
        </div>

        <RewardImageUploader
          onImageChange={setImageBase64}
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? 'Criando...' : 'Criar Recompensa'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
