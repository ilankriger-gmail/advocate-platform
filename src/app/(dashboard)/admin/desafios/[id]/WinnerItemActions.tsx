'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { removeWinner, markPrizeSent } from '@/actions/challenges-admin';

interface WinnerItemActionsProps {
  winnerId: string;
  pixSent: boolean;
}

export function WinnerItemActions({ winnerId, pixSent }: WinnerItemActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const handleMarkPaid = async () => {
    setIsLoading(true);
    const result = await markPrizeSent(winnerId);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setIsLoading(true);
    const result = await removeWinner(winnerId, reason.trim());
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
    setShowReject(false);
    setReason('');
  };

  if (showReject) {
    return (
      <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 space-y-3">
        <p className="text-sm font-medium text-red-700">Motivo da rejeição:</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explique por que o prêmio está sendo rejeitado..."
          rows={3}
          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleReject}
            disabled={isLoading || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5"
          >
            {isLoading ? 'Rejeitando...' : 'Confirmar Rejeição'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowReject(false); setReason(''); }}
            disabled={isLoading}
            className="text-xs px-3 py-1.5"
          >
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!pixSent && (
        <Button
          size="sm"
          onClick={handleMarkPaid}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
        >
          {isLoading ? '...' : '💵 Marcar PIX'}
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowReject(true)}
        disabled={isLoading}
        className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
      >
        ✕ Rejeitar
      </Button>
    </div>
  );
}
