'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { approveParticipation, rejectParticipation } from '@/actions/challenges-admin';

interface ParticipationActionsProps {
  participationId: string;
  coinsReward: number;
  currentStatus?: string;
  coinsEarned?: number;
}

export function ParticipationActions({ participationId, coinsReward, currentStatus, coinsEarned }: ParticipationActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [customCoins, setCustomCoins] = useState(coinsReward);
  const [showCustom, setShowCustom] = useState(false);
  const [showRejectOptions, setShowRejectOptions] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveParticipation(participationId, customCoins);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async (refundMode: 'remove' | 'refund') => {
    const reason = prompt('Motivo da rejeição:');
    if (reason === null) return;

    const modeLabel = refundMode === 'remove'
      ? '❌ Os pontos do desafio serão REMOVIDOS permanentemente.'
      : '🔄 Os pontos de engajamento serão DEVOLVIDOS ao usuário.';

    if (!confirm(`Tem certeza que deseja rejeitar?\n\n${modeLabel}${reason ? `\n\nMotivo: ${reason}` : ''}`)) {
      return;
    }

    setIsLoading(true);
    const result = await rejectParticipation(participationId, reason || 'Participação rejeitada', refundMode);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao rejeitar');
    }
    setIsLoading(false);
    setShowRejectOptions(false);
  };

  const hasEarnedCoins = (coinsEarned || 0) > 0 && currentStatus === 'approved';

  return (
    <div className="space-y-3">
      {showCustom && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Corações:</label>
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

      {/* Reject options panel */}
      {showRejectOptions && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-red-700">Como tratar os pontos?</p>
          
          <button
            onClick={() => handleReject('remove')}
            disabled={isLoading}
            className="w-full text-left px-3 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition text-sm"
          >
            <span className="font-medium text-red-800">❌ Desafio rejeitado</span>
            <br />
            <span className="text-red-600 text-xs">Pontos removidos pra sempre{hasEarnedCoins ? ` (-${coinsEarned} ❤️)` : ''}</span>
          </button>

          <button
            onClick={() => handleReject('refund')}
            disabled={isLoading}
            className="w-full text-left px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition text-sm"
          >
            <span className="font-medium text-blue-800">🔄 Engajamento — devolver pontos</span>
            <br />
            <span className="text-blue-600 text-xs">Pessoa mantém os pontos{hasEarnedCoins ? ` (${coinsEarned} ❤️)` : ''}</span>
          </button>

          <button
            onClick={() => setShowRejectOptions(false)}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-1"
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
          onClick={() => setShowRejectOptions(!showRejectOptions)}
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
