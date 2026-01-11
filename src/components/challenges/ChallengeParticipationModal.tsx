'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { participateInChallenge } from '@/actions/challenges';

interface Challenge {
  id: string;
  title: string;
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
}

interface ChallengeParticipationModalProps {
  challenge: Challenge;
  isOpen: boolean;
  onClose: () => void;
}

export function ChallengeParticipationModal({
  challenge,
  isOpen,
  onClose,
}: ChallengeParticipationModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    resultValue: '',
    proofUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const resultValue = parseInt(formData.resultValue);
    if (isNaN(resultValue) || resultValue <= 0) {
      setError('Informe um valor válido');
      return;
    }

    setIsLoading(true);

    const result = await participateInChallenge({
      challengeId: challenge.id,
      resultValue,
      vídeoProofUrl: formData.proofUrl || undefined,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onClose();
    router.refresh();
  };

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repeticoes';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Participar do Desafio">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info do desafio */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-900">{challenge.title}</h3>
          {challenge.goal_value && (
            <p className="text-sm text-blue-700 mt-1">
              Meta: {challenge.goal_value} {goalLabel}
            </p>
          )}
          <p className="text-sm text-blue-600 mt-1">
            Recompensa: {challenge.coins_reward} corações
          </p>
        </div>

        {/* Resultado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seu resultado ({goalLabel}) *
          </label>
          <Input
            type="number"
            value={formData.resultValue}
            onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
            placeholder={`Ex: ${challenge.goal_value || 50}`}
            min="1"
            required
          />
        </div>

        {/* Link de comprovação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Link de comprovação *
          </label>
          <Input
            type="url"
            value={formData.proofUrl}
            onChange={(e) => setFormData({ ...formData, proofUrl: e.target.value })}
            placeholder="https://instagram.com/reel/... ou youtube.com/..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Cole o link do seu vídeo ou publicação (Instagram, YouTube, TikTok)
            {challenge.hashtag && (
              <>
                <br />
                Use a hashtag <strong>{challenge.hashtag}</strong>
                {challenge.profile_to_tag && (
                  <> e marque <strong>{challenge.profile_to_tag}</strong></>
                )}
              </>
            )}
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Acoes */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
            {isLoading ? 'Enviando...' : 'Enviar Participacao'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
