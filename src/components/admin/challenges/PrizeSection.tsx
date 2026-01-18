'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { Plus, X, DollarSign } from 'lucide-react';
import type { PrizeInput } from '@/lib/supabase/types';

interface PrizeSectionProps {
  prizes: PrizeInput[];
  onChange: (prizes: PrizeInput[]) => void;
  disabled?: boolean;
}

export function PrizeSection({ prizes, onChange, disabled }: PrizeSectionProps) {
  // Filtrar apenas prêmios em dinheiro (corações são configurados no campo simples)
  const moneyPrizes = prizes.filter(p => p.type === 'money');

  // Estado para controlar se está habilitado
  const [isEnabled, setIsEnabled] = useState(moneyPrizes.length > 0);

  // Estado para novo prêmio sendo adicionado
  const [newPrize, setNewPrize] = useState<Partial<PrizeInput> | null>(null);

  // Toggle habilitar/desabilitar
  const toggleEnabled = () => {
    if (isEnabled) {
      // Desabilitar - remover prêmios em dinheiro
      onChange(prizes.filter(p => p.type !== 'money'));
    }
    setIsEnabled(!isEnabled);
  };

  // Salvar novo prêmio
  const savePrize = () => {
    if (!newPrize || !newPrize.name?.trim()) return;

    const prize: PrizeInput = {
      type: 'money',
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

  return (
    <Card className="p-5 space-y-4">
      <h2 className="font-bold text-gray-900">Prêmios em Dinheiro (opcional)</h2>
      <p className="text-sm text-gray-500">
        Configure prêmios em dinheiro (PIX) para os ganhadores do desafio
      </p>

      <div className="border rounded-lg overflow-hidden">
        {/* Header com checkbox */}
        <label
          className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
            isEnabled ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        >
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={toggleEnabled}
            disabled={disabled}
            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <div className="p-2 rounded-lg bg-green-100 text-green-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="font-medium text-gray-900">Dinheiro (PIX)</span>
            <p className="text-xs text-gray-500">PIX, transferência ou vale</p>
          </div>
        </label>

        {/* Conteúdo expandido quando habilitado */}
        {isEnabled && (
          <div className="p-4 border-t bg-white space-y-3">
            {/* Lista de prêmios existentes */}
            {moneyPrizes.map((prize, idx) => {
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
            {newPrize ? (
              <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição *
                    </label>
                    <Input
                      value={newPrize.name || ''}
                      onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                      placeholder="Ex: PIX para o ganhador"
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
                      onFocus={(e) => e.target.select()}
                      placeholder="100.00"
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Qtd. Ganhadores
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newPrize.quantity || ''}
                      onChange={(e) => setNewPrize({ ...newPrize, quantity: e.target.value ? parseInt(e.target.value) : undefined })}
                      onFocus={(e) => e.target.select()}
                      placeholder="1"
                      disabled={disabled}
                    />
                  </div>
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
                onClick={() => setNewPrize({ type: 'money', name: '' })}
                disabled={disabled}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar Prêmio em Dinheiro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Resumo */}
      {moneyPrizes.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{moneyPrizes.length}</span> prêmio(s) em dinheiro configurado(s)
            {moneyPrizes.reduce((sum, p) => sum + p.quantity, 0) > moneyPrizes.length && (
              <span className="text-gray-500">
                {' '}({moneyPrizes.reduce((sum, p) => sum + p.quantity, 0)} ganhadores no total)
              </span>
            )}
          </p>
        </div>
      )}
    </Card>
  );
}
