'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Plus, X, DollarSign, Package, Smartphone } from 'lucide-react';
import type { PrizeInput, PrizeType } from '@/lib/supabase/types';

interface PrizeSectionProps {
  prizes: PrizeInput[];
  onChange: (prizes: PrizeInput[]) => void;
  disabled?: boolean;
}

const prizeTypeConfig: Record<PrizeType, {
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  money: {
    label: 'Dinheiro',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'PIX, transferência ou vale',
    color: 'green',
  },
  physical: {
    label: 'Físico',
    icon: <Package className="w-5 h-5" />,
    description: 'Produtos, camisetas, equipamentos',
    color: 'blue',
  },
  digital: {
    label: 'Digital',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Códigos, vouchers, e-books',
    color: 'purple',
  },
};

export function PrizeSection({ prizes, onChange, disabled }: PrizeSectionProps) {
  // Estado para controlar quais tipos estão habilitados
  const [enabledTypes, setEnabledTypes] = useState<Set<PrizeType>>(() => {
    const types = new Set<PrizeType>();
    prizes.forEach(p => types.add(p.type));
    return types;
  });

  // Estado para novo prêmio sendo adicionado
  const [newPrize, setNewPrize] = useState<Partial<PrizeInput> | null>(null);

  // Toggle de tipo de prêmio
  const toggleType = (type: PrizeType) => {
    const newEnabled = new Set(enabledTypes);
    if (newEnabled.has(type)) {
      newEnabled.delete(type);
      // Remover prêmios desse tipo
      onChange(prizes.filter(p => p.type !== type));
    } else {
      newEnabled.add(type);
    }
    setEnabledTypes(newEnabled);
  };

  // Adicionar prêmio
  const addPrize = (type: PrizeType) => {
    setNewPrize({ type, name: '', quantity: 1 });
  };

  // Salvar novo prêmio
  const savePrize = () => {
    if (!newPrize || !newPrize.type || !newPrize.name?.trim()) return;

    const prize: PrizeInput = {
      type: newPrize.type,
      name: newPrize.name.trim(),
      description: newPrize.description?.trim(),
      value: newPrize.value,
      quantity: newPrize.quantity || 1,
      image_url: newPrize.image_url,
    };

    onChange([...prizes, prize]);
    setNewPrize(null);
  };

  // Remover prêmio
  const removePrize = (index: number) => {
    const newPrizes = [...prizes];
    newPrizes.splice(index, 1);
    onChange(newPrizes);
  };

  // Prêmios por tipo
  const prizesByType = (type: PrizeType) =>
    prizes.filter(p => p.type === type);

  return (
    <Card className="p-5 space-y-4">
      <h2 className="font-bold text-gray-900">Prêmios do Desafio</h2>
      <p className="text-sm text-gray-500">
        Selecione os tipos de prêmio que serão oferecidos neste desafio
      </p>

      {/* Checkboxes para cada tipo */}
      <div className="space-y-4">
        {(Object.keys(prizeTypeConfig) as PrizeType[]).map((type) => {
          const config = prizeTypeConfig[type];
          const isEnabled = enabledTypes.has(type);
          const typePrizes = prizesByType(type);

          return (
            <div key={type} className="border rounded-lg overflow-hidden">
              {/* Header com checkbox */}
              <label
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                  isEnabled ? `bg-${config.color}-50` : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleType(type)}
                  disabled={disabled}
                  className={`w-5 h-5 rounded border-gray-300 text-${config.color}-600 focus:ring-${config.color}-500`}
                />
                <div className={`p-2 rounded-lg bg-${config.color}-100 text-${config.color}-600`}>
                  {config.icon}
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{config.label}</span>
                  <p className="text-xs text-gray-500">{config.description}</p>
                </div>
              </label>

              {/* Conteúdo expandido quando habilitado */}
              {isEnabled && (
                <div className="p-4 border-t bg-white space-y-3">
                  {/* Lista de prêmios existentes */}
                  {typePrizes.map((prize, idx) => {
                    const globalIdx = prizes.findIndex(p => p === prize);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{prize.name}</p>
                          <p className="text-sm text-gray-500">
                            Qtd: {prize.quantity}
                            {prize.value && ` | R$ ${prize.value.toFixed(2)}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrize(globalIdx)}
                          disabled={disabled}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Formulário de novo prêmio */}
                  {newPrize?.type === type ? (
                    <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {type === 'money' ? 'Descrição' : 'Nome do Prêmio'} *
                          </label>
                          <Input
                            value={newPrize.name || ''}
                            onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                            placeholder={type === 'money' ? 'Ex: PIX para o ganhador' : 'Ex: Camiseta Exclusiva'}
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valor (R$)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newPrize.value || ''}
                            onChange={(e) => setNewPrize({ ...newPrize, value: parseFloat(e.target.value) || undefined })}
                            placeholder="100.00"
                            disabled={disabled}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={newPrize.quantity || 1}
                            onChange={(e) => setNewPrize({ ...newPrize, quantity: parseInt(e.target.value) || 1 })}
                            disabled={disabled}
                          />
                        </div>
                        {type !== 'money' && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Descrição (opcional)
                            </label>
                            <Input
                              value={newPrize.description || ''}
                              onChange={(e) => setNewPrize({ ...newPrize, description: e.target.value })}
                              placeholder="Detalhes do prêmio..."
                              disabled={disabled}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={savePrize}
                          disabled={disabled || !newPrize.name?.trim()}
                        >
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setNewPrize(null)}
                          disabled={disabled}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPrize(type)}
                      disabled={disabled}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar {config.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo */}
      {prizes.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{prizes.length}</span> prêmio(s) configurado(s)
            {prizes.reduce((sum, p) => sum + p.quantity, 0) > prizes.length && (
              <span className="text-gray-500">
                {' '}({prizes.reduce((sum, p) => sum + p.quantity, 0)} unidades no total)
              </span>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
