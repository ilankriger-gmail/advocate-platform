'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { deleteChallenge } from '@/actions/challenges';

interface ChallengeDeleteButtonProps {
  challengeId: string;
  challengeName: string;
  canDelete: boolean;
  participantsCount: number;
  winnersCount: number;
}

export function ChallengeDeleteButton({
  challengeId,
  challengeName,
  canDelete,
  participantsCount,
  winnersCount,
}: ChallengeDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    console.log('ChallengeDeleteButton: Iniciando delete do desafio', challengeId);
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteChallenge(challengeId);
      console.log('ChallengeDeleteButton: Resultado do delete:', result);

      if (result.success) {
        console.log('ChallengeDeleteButton: Delete bem sucedido, atualizando pagina');
        setShowConfirm(false);
        router.refresh();
      } else {
        console.log('ChallengeDeleteButton: Delete falhou:', result.error);
        setError(result.error || 'Erro ao excluir');
      }
    } catch (err) {
      console.error('ChallengeDeleteButton: Erro inesperado:', err);
      setError('Erro inesperado ao excluir');
    }

    setIsDeleting(false);
  };

  // Se não pode excluir, mostrar botão desabilitado com tooltip
  if (!canDelete) {
    const reason = participantsCount > 0
      ? `${participantsCount} participante(s)`
      : `${winnersCount} ganhador(es)`;

    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled
          className="border-gray-200 text-gray-400 cursor-not-allowed"
          title={`Não é possível excluir: ${reason}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </Button>
        <span className="text-xs text-gray-400">
          {reason}
        </span>
      </div>
    );
  }

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
        Excluir
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-600">
        Excluir &quot;{challengeName}&quot;?
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting ? 'Excluindo...' : 'Confirmar'}
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
