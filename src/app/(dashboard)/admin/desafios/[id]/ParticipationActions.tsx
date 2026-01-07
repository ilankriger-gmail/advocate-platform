'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { approveParticipation, rejectParticipation } from '@/actions/challenges';

interface ParticipationActionsProps {
  participationId: string;
  coinsReward: number;
}

export function ParticipationActions({ participationId, coinsReward }: ParticipationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customCoins, setCustomCoins] = useState(coinsReward);
  const [showCustom, setShowCustom] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveParticipation(participationId, customCoins);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    const result = await rejectParticipation(participationId, 'Participacao rejeitada');
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      {showCustom && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Coracoes:</label>
          <input
            type="number"
            value={customCoins}
            onChange={(e) => setCustomCoins(parseInt(e.target.value) || 0)}
            className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm"
            min="0"
          />
          <button
            type="button"
            onClick={() => setShowCustom(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? 'Processando...' : `Aprovar (+${customCoins})`}
        </Button>
        <Button
          onClick={handleReject}
          disabled={isLoading}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          Rejeitar
        </Button>
        {!showCustom && (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
