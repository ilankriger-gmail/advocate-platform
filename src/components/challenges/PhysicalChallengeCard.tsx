'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { ChallengeParticipationModal } from './ChallengeParticipationModal';
import YouTubeEmbed from '@/components/posts/YouTubeEmbed';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  record_vídeo_url: string | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
  raffle_enabled?: boolean;
  raffle_prize_amount?: number;
  raffle_frequency_days?: number;
}

interface Participation {
  status: 'pending' | 'approved' | 'rejected';
  result_value: number | null;
  coins_earned: number;
}

interface PhysicalChallengeCardProps {
  challenge: Challenge;
  participation?: Participation | null;
}

export function PhysicalChallengeCard({
  challenge,
  participation,
}: PhysicalChallengeCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repeticoes';
  const hasParticipated = !!participation;

  const getStatusBadge = () => {
    if (!participation) return null;

    switch (participation.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Aguardando</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejeitado</Badge>;
    }
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{challenge.icon}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-lg">{challenge.title}</h3>
              {getStatusBadge()}
            </div>

            <p className="text-gray-500 text-sm mt-1 whitespace-pre-line">{challenge.description}</p>

            {challenge.goal_value && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-medium">
                  Meta: {challenge.goal_value} {goalLabel}
                </p>
                {participation?.result_value && (
                  <p className="text-sm text-blue-600 mt-1">
                    Seu resultado: {participation.result_value} {goalLabel}
                  </p>
                )}
              </div>
            )}

            {/* Info do Sorteio */}
            {challenge.raffle_enabled && challenge.raffle_prize_amount && (
              <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎰</span>
                  <div>
                    <p className="text-purple-700 font-medium text-sm">
                      Sorteio: R$ {challenge.raffle_prize_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600">
                      Bata a meta e concorra ao sorteio mensal!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Vídeo de referência embeddado */}
            {challenge.record_vídeo_url && (
              <div className="mt-3">
                <YouTubeEmbed url={challenge.record_vídeo_url} title={challenge.title} />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-pink-500 font-bold">+{challenge.coins_reward} corações</span>

              {hasParticipated ? (
                <div className="text-sm text-gray-500">
                  {participation.status === 'approved' && (
                    <span className="text-green-600 font-medium">
                      +{participation.coins_earned} corações ganhos!
                    </span>
                  )}
                  {participation.status === 'pending' && 'Aguardando avaliacao'}
                  {participation.status === 'rejected' && 'Tente novamente'}
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  Participar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <ChallengeParticipationModal
        challenge={challenge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
