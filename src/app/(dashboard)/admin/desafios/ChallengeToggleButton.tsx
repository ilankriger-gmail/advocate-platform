'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { toggleChallengeActive } from '@/actions/challenges-admin';

interface ChallengeToggleButtonProps {
  challengeId: string;
  challengeName: string;
  isActive: boolean;
}

export function ChallengeToggleButton({
  challengeId,
  challengeName,
  isActive,
}: ChallengeToggleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    console.log('ChallengeToggleButton: Iniciando toggle', { challengeId, isActive, newValue: !isActive });
    setIsLoading(true);
    setError(null);

    try {
      console.log('ChallengeToggleButton: Chamando toggleChallengeActive...');
      const result = await toggleChallengeActive(challengeId, !isActive);
      console.log('ChallengeToggleButton: Resultado:', result);

      if (result.success) {
        console.log('ChallengeToggleButton: Sucesso! Fazendo refresh...');
        setShowConfirm(false);
        router.refresh();
      } else {
        console.log('ChallengeToggleButton: Erro retornado:', result.error);
        setError(result.error || 'Erro ao atualizar');
      }
    } catch (err) {
      console.error('ChallengeToggleButton: Erro inesperado:', err);
      setError('Erro inesperado');
    }

    setIsLoading(false);
  };

  // Se está ativo, mostra botão de ocultar (vermelho)
  // Se está inativo, mostra botão de reativar (verde)
  if (!showConfirm) {
    return (
      <Button
        onClick={() => setShowConfirm(true)}
        size="sm"
        variant="outline"
        className={isActive
          ? 'border-red-300 text-red-600 hover:bg-red-50'
          : 'border-green-300 text-green-600 hover:bg-green-50'
        }
      >
        {isActive ? (
          <>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Ocultar
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Reativar
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-gray-600">
        {isActive ? 'Ocultar' : 'Reativar'} &quot;{challengeName}&quot;?
      </p>
      <div className="flex gap-2">
        <Button
          onClick={handleToggle}
          disabled={isLoading}
          size="sm"
          className={isActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
          }
        >
          {isLoading ? '...' : 'Confirmar'}
        </Button>
        <Button
          onClick={() => { setShowConfirm(false); setError(null); }}
          disabled={isLoading}
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
