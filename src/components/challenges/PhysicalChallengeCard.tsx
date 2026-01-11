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
  record_video_url: string | null;
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-2xl">{challenge.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{challenge.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-white/90 text-sm font-medium">+{challenge.coins_reward} coracoes</span>
                </div>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Conteudo */}
        <div className="p-5 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{challenge.description}</p>

          {/* Meta */}
          {challenge.goal_value && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎯</span>
              </div>
              <div className="flex-1">
                <p className="text-blue-800 font-semibold">
                  Meta: {challenge.goal_value} {goalLabel}
                </p>
                {participation?.result_value && (
                  <p className="text-sm text-blue-600">
                    Seu resultado: {participation.result_value} {goalLabel}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info do Sorteio */}
          {challenge.raffle_enabled && challenge.raffle_prize_amount && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🎰</span>
              </div>
              <div>
                <p className="text-purple-800 font-semibold">
                  Sorteio: R$ {challenge.raffle_prize_amount.toFixed(2)}
                </p>
                <p className="text-sm text-purple-600">
                  Bata a meta e concorra ao sorteio mensal!
                </p>
              </div>
            </div>
          )}

          {/* Video de referencia embeddado */}
          {challenge.record_video_url && (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <YouTubeEmbed url={challenge.record_video_url} title={challenge.title} />
            </div>
          )}

          {/* Acao */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            {hasParticipated ? (
              <div className="text-sm">
                {participation.status === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                    <span>✓</span> +{participation.coins_earned} coracoes ganhos!
                  </span>
                )}
                {participation.status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    <span className="animate-pulse">⏳</span> Aguardando avaliacao
                  </span>
                )}
                {participation.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-medium">
                    Tente novamente
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  onClick={() => setIsModalOpen(true)}
                >
                  Participar do Desafio
                </Button>
              </div>
            )}
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
