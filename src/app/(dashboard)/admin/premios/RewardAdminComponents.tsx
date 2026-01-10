'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { toggleRewardActive, createReward, approveClaim, markClaimShipped, markClaimDelivered } from '@/actions/rewards-admin';

interface RewardActionsProps {
  reward: {
    id: string;
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
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      size="sm"
      variant="outline"
      className={reward.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
    >
      {isLoading ? '...' : reward.is_active ? 'Desativar' : 'Ativar'}
    </Button>
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

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins_cost: '',
    stock: '',
    type: 'digital' as 'digital' | 'physical',
    image_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.coins_cost) {
      setError('Nome e custo em coracoes sao obrigatorios');
      return;
    }

    setIsLoading(true);

    const result = await createReward({
      name: formData.name,
      description: formData.description || null,
      coins_cost: parseInt(formData.coins_cost),
      stock: formData.stock ? parseInt(formData.stock) : null,
      type: formData.type,
      image_url: formData.image_url || null,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setFormData({
      name: '',
      description: '',
      coins_cost: '',
      stock: '',
      type: 'digital',
      image_url: '',
    });
    setIsOpen(false);
    router.refresh();
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <Card className="p-5">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-2xl">+</span>
          <span>Criar Nova Recompensa</span>
        </button>
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'digital' | 'physical' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="digital">Digital</option>
              <option value="physical">Fisico</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
            <Input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

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
