'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { toggleChallengeActive } from '@/actions/challenges-admin';

interface ChallengeDeleteButtonProps {
  challengeId: string;
  challengeName: string;
  canDelete?: boolean;
  participantsCount?: number;
  winnersCount?: number;
}

export function ChallengeDeleteButton({
  challengeId,
  challengeName,
}: ChallengeDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      // Soft delete: apenas desativa o desafio
      const result = await toggleChallengeActive(challengeId, false);

      if (result.success) {
        setShowConfirm(false);
        router.refresh();
      } else {
        setError(result.error || 'Erro ao ocultar');
      }
    } catch (err) {
      console.error('ChallengeDeleteButton: Erro inesperado:', err);
      setError('Erro inesperado');
    }

    setIsDeleting(false);
  };

  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        size="sm"
        variant="outline"
        className="border-red-300 text-red-600 hover:bg-red-50"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Ocultar
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-600">
        Ocultar &quot;{challengeName}&quot;?
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Ocultando...' : 'Confirmar'}
        </Button>
        <Button
          onClick={() => { setShowConfirm(false); setError(null); }}
          disabled={isDeleting}
          size="sm"
          variant="outline"
        >
          Cancelar
        </Button>
      </div>
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
