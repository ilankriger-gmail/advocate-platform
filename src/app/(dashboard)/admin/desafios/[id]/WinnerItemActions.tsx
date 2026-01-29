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
  const [showConfirm, setShowConfirm] = useState(false);

  const handleMarkPaid = async () => {
    setIsLoading(true);
    const result = await markPrizeSent(winnerId);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleRemove = async () => {
    setIsLoading(true);
    const result = await removeWinner(winnerId);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600 font-medium">Tem certeza?</span>
        <Button
          size="sm"
          onClick={handleRemove}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1"
        >
          {isLoading ? '...' : 'Sim, remover'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isLoading}
          className="text-xs px-2 py-1"
        >
          Não
        </Button>
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
        onClick={() => setShowConfirm(true)}
        disabled={isLoading}
        className="border-red-300 text-red-600 hover:bg-red-50 text-xs px-2 py-1"
      >
        ✕ Rejeitar
      </Button>
    </div>
  );
}
