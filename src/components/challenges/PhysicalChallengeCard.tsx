'use client';

import { useState } from 'react';
import { Badge, Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui';
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

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repetições';
  const hasParticipated = !!participation;

  const getStatusBadge = () => {
    if (!participation) return null;

    switch (participation.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Aguardando</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 text-xs">Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 text-xs">Rejeitado</Badge>;
    }
  };

  return (
    <>
      <Accordion type="single">
        <AccordionItem value={challenge.id}>
          <AccordionTrigger className="p-4">
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{challenge.icon}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{challenge.title}</h3>
                  {getStatusBadge()}
                </div>
                {challenge.goal_value && (
                  <p className="text-sm text-gray-500">
                    Meta: {challenge.goal_value} {goalLabel}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium text-blue-500 whitespace-nowrap flex-shrink-0">
                +{challenge.coins_reward} ❤️
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {/* Descrição */}
              {challenge.description && (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {challenge.description}
                </p>
              )}

              {/* Meta */}
              {challenge.goal_value && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🎯</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-800 font-semibold text-sm">
                      Meta: {challenge.goal_value} {goalLabel}
                    </p>
                    {participation?.result_value && (
                      <p className="text-xs text-blue-600">
                        Seu resultado: {participation.result_value} {goalLabel}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info do Sorteio */}
              {challenge.raffle_enabled && challenge.raffle_prize_amount && (
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">🎰</span>
                  </div>
                  <div>
                    <p className="text-purple-800 font-semibold text-sm">
                      Sorteio: R$ {challenge.raffle_prize_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600">
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

              {/* Ação */}
              <div className="pt-2">
                {hasParticipated ? (
                  <div className="text-sm">
                    {participation.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">
                        <span>✓</span> +{participation.coins_earned} corações ganhos!
                      </span>
                    )}
                    {participation.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                        <span className="animate-pulse">⏳</span> Aguardando avaliação
                      </span>
                    )}
                    {participation.status === 'rejected' && (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                        onClick={() => setIsModalOpen(true)}
                      >
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Participar do Desafio
                  </Button>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <ChallengeParticipationModal
        challenge={challenge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
