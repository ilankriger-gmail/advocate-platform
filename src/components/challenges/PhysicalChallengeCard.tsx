'use client';

import { useState } from 'react';
import { DollarSign, Package, Smartphone } from 'lucide-react';
import { Badge, Button, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui';
import { ChallengeParticipationModal } from './ChallengeParticipationModal';
import YouTubeEmbed from '@/components/posts/YouTubeEmbed';

interface ChallengePrize {
  id: string;
  type: 'physical' | 'digital' | 'money';
  name: string;
  description: string | null;
  value: number | null;
  quantity: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  thumbnail_url?: string | null;
  type?: 'fisico' | 'atos_amor' | 'engajamento' | 'participe';
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  record_video_url: string | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
  action_instructions?: string | null;
  raffle_enabled?: boolean;
  raffle_prize_amount?: number;
  raffle_frequency_days?: number;
  prizes?: ChallengePrize[];
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
  const isAtosAmor = challenge.type === 'atos_amor';

  // Cores baseadas no tipo
  const gradientColors = isAtosAmor
    ? 'from-rose-600 to-pink-500'
    : 'from-blue-600 to-cyan-500';
  const buttonGradient = isAtosAmor
    ? 'from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'
    : 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600';

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
          <AccordionTrigger className="p-0 hover:no-underline">
            <div className="relative w-full overflow-hidden rounded-t-xl">
              {/* Background: Thumbnail ou Gradiente */}
              {challenge.thumbnail_url ? (
                <>
                  <img
                    src={challenge.thumbnail_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                </>
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-r ${gradientColors}`} />
              )}

              {/* Conteúdo */}
              <div className="relative z-10 p-4 flex items-center gap-3 w-full">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  challenge.thumbnail_url ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/20'
                }`}>
                  <span className="text-xl">{challenge.icon}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold truncate ${challenge.thumbnail_url ? 'text-white' : 'text-white'}`}>
                      {challenge.title}
                    </h3>
                    {getStatusBadge()}
                  </div>
                  {challenge.goal_value && (
                    <p className={`text-sm ${challenge.thumbnail_url ? 'text-white/80' : 'text-white/80'}`}>
                      Meta: {challenge.goal_value} {goalLabel}
                    </p>
                  )}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap flex-shrink-0 ${
                  challenge.thumbnail_url ? 'text-white' : 'text-white'
                }`}>
                  +{challenge.coins_reward} ❤️
                </span>
              </div>
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

              {/* Instruções do Ato de Amor */}
              {isAtosAmor && challenge.action_instructions && (
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                  <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm">💝</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-rose-800 font-semibold text-sm mb-1">
                      Como participar:
                    </p>
                    <p className="text-xs text-rose-600 whitespace-pre-line">
                      {challenge.action_instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Meta (apenas para desafios físicos) */}
              {!isAtosAmor && challenge.goal_value && (
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

              {/* Prêmios do Desafio */}
              {challenge.prizes && challenge.prizes.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                    🎁 Prêmios
                  </p>
                  <div className="grid gap-2">
                    {challenge.prizes.map((prize) => {
                      const prizeConfig = {
                        money: {
                          icon: <DollarSign className="w-4 h-4" />,
                          bg: 'bg-green-50 border-green-200',
                          iconBg: 'bg-green-500',
                          text: 'text-green-800',
                        },
                        physical: {
                          icon: <Package className="w-4 h-4" />,
                          bg: 'bg-blue-50 border-blue-200',
                          iconBg: 'bg-blue-500',
                          text: 'text-blue-800',
                        },
                        digital: {
                          icon: <Smartphone className="w-4 h-4" />,
                          bg: 'bg-purple-50 border-purple-200',
                          iconBg: 'bg-purple-500',
                          text: 'text-purple-800',
                        },
                      };
                      const config = prizeConfig[prize.type];

                      return (
                        <div
                          key={prize.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${config.bg}`}
                        >
                          <div className={`w-8 h-8 ${config.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 text-white`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${config.text}`}>
                              {prize.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {prize.value && `R$ ${prize.value.toFixed(2)}`}
                              {prize.value && prize.quantity > 1 && ' • '}
                              {prize.quantity > 1 && `${prize.quantity}x`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
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
                        className={`w-full bg-gradient-to-r ${buttonGradient}`}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className={`w-full bg-gradient-to-r ${buttonGradient}`}
                    onClick={() => setIsModalOpen(true)}
                  >
                    {isAtosAmor ? 'Enviar Meu Ato de Amor' : 'Participar do Desafio'}
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
