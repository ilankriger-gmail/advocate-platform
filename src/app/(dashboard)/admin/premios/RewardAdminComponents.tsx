'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { toggleRewardActive, createReward, approveClaim, rejectClaim, markClaimShipped, markClaimDelivered, uploadRewardImageToStorage, uploadPaymentReceipt } from '@/actions/rewards-admin';
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
    delivery_address?: {
      pix_key?: string;
      payment_receipt_url?: string;
      [key: string]: unknown;
    };
  };
  rewardType?: string;
}

export function ClaimActions({ claim, rewardType }: ClaimActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState(claim.delivery_address?.payment_receipt_url || '');

  const handleApprove = async (withPost = false) => {
    setIsLoading(true);
    const result = await approveClaim(claim.id, withPost);
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

  const handleReject = async () => {
    const reason = prompt('Motivo da rejeição (os corações serão devolvidos ao usuário):');
    if (reason === null) return; // Cancelled
    
    if (!confirm(`Tem certeza que deseja REJEITAR este resgate?\n\nOs corações gastos serão devolvidos ao usuário.${reason ? `\n\nMotivo: ${reason}` : ''}`)) {
      return;
    }

    setIsLoading(true);
    const result = await rejectClaim(claim.id, reason || undefined);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao rejeitar');
    }
    setIsLoading(false);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await uploadPaymentReceipt(claim.id, base64);
      if (result.success && result.data) {
        setReceiptUrl(result.data.url);
        router.refresh();
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const isPix = rewardType === 'money' || claim.delivery_address?.pix_key;

  if (claim.status === 'pending') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            onClick={() => handleApprove(false)}
            disabled={isLoading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '...' : '✅ Aprovar'}
          </Button>
          <Button
            onClick={() => handleApprove(true)}
            disabled={isLoading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            title="Aprovar e criar post de celebração"
          >
            {isLoading ? '...' : '📣 Aprovar + Publicar'}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            title="Rejeitar e devolver corações"
          >
            {isLoading ? '...' : '❌ Rejeitar'}
          </Button>
        </div>

        {/* Upload comprovante PIX */}
        {isPix && (
          <div className="mt-2">
            {receiptUrl ? (
              <div className="space-y-2">
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100">
                  <span>✅ Comprovante enviado</span>
                  <span className="underline">Ver</span>
                </a>
                <label className="block">
                  <span className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Trocar comprovante</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-yellow-700">
                  {isUploading ? 'Enviando...' : '📸 Subir comprovante PIX'}
                </span>
                <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" disabled={isUploading} />
              </label>
            )}
          </div>
        )}
      </div>
    );
  }

  if (claim.status === 'approved') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleShip}
          disabled={isLoading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? '...' : 'Marcar Enviado'}
        </Button>
        {isPix && !receiptUrl && (
          <label className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
            <span className="text-sm font-medium text-yellow-700">
              {isUploading ? 'Enviando...' : '📸 Subir comprovante'}
            </span>
            <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" disabled={isUploading} />
          </label>
        )}
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">✅ Ver comprovante</a>
        )}
      </div>
    );
  }

  if (claim.status === 'shipped') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleDeliver}
          disabled={isLoading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? '...' : 'Confirmar Entrega'}
        </Button>
        {receiptUrl && (
          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">✅ Ver comprovante</a>
        )}
      </div>
    );
  }

  return receiptUrl ? (
    <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">✅ Comprovante</a>
  ) : null;
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
      description: `Seu prêmio está te esperando 🎉
O resgate é simples e seguro. O valor será enviado via PIX diretamente para a sua chave após a aprovação.
No momento do resgate, você informa sua chave PIX, pode ser CPF, e-mail, telefone ou chave aleatória.

Importante, eu nunca entro em contato pedindo PIX, pagamento ou qualquer tipo de transferência.
O resgate acontece só por aqui, de forma clara e transparente.`,
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
              onFocus={(e) => e.target.select()}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            onFocus={(e) => e.target.select()}
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
