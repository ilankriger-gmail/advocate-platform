import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Dumbbell, Trophy, Heart, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui';
import { PhysicalChallengeCard, MyParticipationCard } from '@/components/challenges';
import type { ParticipationWithChallenge, ChallengePrize } from '@/lib/supabase/types';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_desafios_title',
    'seo_desafios_description',
  ]);

  return {
    title: settings.seo_desafios_title,
    description: settings.seo_desafios_description,
    openGraph: {
      title: settings.seo_desafios_title,
      description: settings.seo_desafios_description,
    },
  };
}

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: 'participe' | 'engajamento' | 'fisico' | 'atos_amor';
  icon: string;
  thumbnail_url?: string | null;
  is_active: boolean;
  instagram_embed_url?: string;
  prize_amount?: number;
  num_winners?: number;
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  record_video_url: string | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
  starts_at?: string;
  ends_at?: string;
  action_instructions?: string | null;
  raffle_enabled?: boolean;
  raffle_prize_amount?: number;
  raffle_frequency_days?: number;
  prizes?: ChallengePrize[];
};

type Winner = {
  id: string;
  challenge_id: string;
  instagram_username?: string;
  prize_amount?: number;
  pix_sent: boolean;
};

type Participation = {
  challenge_id: string;
  status: 'pending' | 'approved' | 'rejected';
  result_value: number | null;
  coins_earned: number;
};

export default async function DesafiosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Paralelizar todas as queries para melhor performance
  const [
    { data: challenges },
    { data: winners },
    { data: participations },
    { data: allUserParticipations },
    { data: userCoins },
    { data: allPrizes }
  ] = await Promise.all([
    // Buscar desafios ativos
    supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    // Buscar ganhadores
    supabase
      .from('challenge_winners')
      .select('*')
      .order('created_at', { ascending: false }),
    // Buscar participações do usuário (para o mapa de verificação)
    supabase
      .from('challenge_participants')
      .select('challenge_id, status, result_value, coins_earned')
      .eq('user_id', user.id),
    // Buscar todas as participações com dados completos (para a seção "Minhas Participações")
    supabase
      .from('challenge_participants')
      .select(`
        *,
        challenges (title, goal_type, goal_value, coins_reward)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    // Buscar saldo de corações (maybeSingle para usuários novos sem registro)
    supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle(),
    // Buscar todos os prêmios dos desafios
    supabase
      .from('challenge_prizes')
      .select('*')
      .order('type', { ascending: true })
  ]);

  // Cast para o tipo correto
  const userParticipationsWithChallenge = (allUserParticipations || []) as ParticipationWithChallenge[];

  const balance = userCoins?.balance || 0;

  // Mapa de participações
  const participationMap = new Map(
    (participations || []).map(p => [p.challenge_id, p])
  );

  // Mapa de prêmios por desafio
  const prizesMap = new Map<string, ChallengePrize[]>();
  (allPrizes || []).forEach((prize: ChallengePrize) => {
    const existing = prizesMap.get(prize.challenge_id) || [];
    existing.push(prize);
    prizesMap.set(prize.challenge_id, existing);
  });

  // Adicionar prêmios aos desafios
  const challengesWithPrizes = (challenges || []).map(c => ({
    ...c,
    prizes: prizesMap.get(c.id) || []
  })) as Challenge[];

  // Agrupar por tipo
  const engagementChallenges = challengesWithPrizes.filter(
    c => c.type === 'participe' || c.type === 'engajamento'
  );
  const physicalChallenges = challengesWithPrizes.filter(c => c.type === 'fisico');
  const atosAmorChallenges = challengesWithPrizes.filter(c => c.type === 'atos_amor');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Desafios"
        description="Participe dos desafios e ganhe corações"
      />

      {/* Saldo - Card Premium (responsivo para mobile) */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-pink-100 text-xs sm:text-sm font-medium tracking-wide uppercase">Seus corações</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl sm:text-5xl font-black tracking-tight">{balance}</p>
                <p className="text-lg sm:text-xl font-medium text-pink-100">corações</p>
              </div>
              <p className="text-pink-200 text-xs sm:text-sm mt-2">Complete desafios para ganhar mais!</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-white/20 rounded-full" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                <span className="text-4xl sm:text-5xl">❤️‍🔥</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Minhas Participações - No topo, após saldo */}
      {userParticipationsWithChallenge.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          {/* Header da Seção - Centralizado */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Minhas Participações</h2>
              <p className="text-gray-500 text-xs sm:text-sm">Acompanhe o status dos seus desafios enviados</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
            {userParticipationsWithChallenge.map((participation) => (
              <MyParticipationCard key={participation.id} participation={participation} />
            ))}
          </div>
        </section>
      )}

      {/* =============================================== */}
      {/* CATEGORIAS COM DESAFIOS - Aparecem primeiro */}
      {/* =============================================== */}

      {/* Desafios de Engajamento - Só se tiver desafios */}
      {engagementChallenges.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          {/* Header da Seção - Centralizado */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-2xl sm:text-3xl">🎁</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Participe e Concorra</h2>
              <p className="text-gray-500 text-xs sm:text-sm">Interaja no Instagram e ganhe prêmios em dinheiro</p>
            </div>
          </div>

          <Accordion type="single" className="max-w-2xl mx-auto space-y-2">
            {engagementChallenges.map((challenge) => {
              const challengeWinners = (winners || []).filter(
                w => w.challenge_id === challenge.id
              );

              return (
                <AccordionItem key={challenge.id} value={challenge.id}>
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
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500" />
                      )}

                      {/* Conteúdo */}
                      <div className="relative z-10 p-4 flex items-center gap-3 w-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          challenge.thumbnail_url ? 'bg-white/20 backdrop-blur-sm' : 'bg-white/20'
                        }`}>
                          <span className="text-xl">{challenge.icon}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="font-semibold text-white">{challenge.title}</h3>
                          {challenge.prize_amount && (
                            <p className="text-sm text-white/90">
                              R$ {challenge.prize_amount.toFixed(2)} no Pix
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-medium text-white whitespace-nowrap">
                          +{challenge.coins_reward} ❤️
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <p className="text-gray-700 text-sm whitespace-pre-line">{challenge.description}</p>

                      {/* Regras */}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-2">
                          📋 Como participar:
                        </h4>
                        <ul className="space-y-1 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            <span className="text-gray-600">Acesse o post no Instagram</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            <span className="text-gray-600">Deixe seu comentário criativo</span>
                          </li>
                          {challenge.num_winners && (
                            <li className="flex items-start gap-2">
                              <span className="text-pink-500">•</span>
                              <span className="text-gray-600">
                                {challenge.num_winners} ganhador(es) serão selecionados
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>

                      {challenge.ends_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          📅 Válido até: <strong>{formatDate(challenge.ends_at)}</strong>
                        </div>
                      )}

                      {/* Botao Instagram */}
                      {challenge.instagram_embed_url && (
                        <a
                          href={challenge.instagram_embed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-full min-h-[44px] py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                        >
                          Ver post no Instagram 📲
                        </a>
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
                                coins: {
                                  icon: <Heart className="w-4 h-4" />,
                                  bg: 'bg-pink-50 border-pink-200',
                                  iconBg: 'bg-pink-500',
                                  text: 'text-pink-800',
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

                      {/* Ganhadores */}
                      {challengeWinners.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-900 text-sm mb-3">
                            🏆 Ganhadores
                          </h4>
                          <div className="space-y-2">
                            {challengeWinners.map((winner) => (
                              <div
                                key={winner.id}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span>🎉</span>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      @{winner.instagram_username || 'Usuário'}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      R$ {winner.prize_amount?.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                                {winner.pix_sent && (
                                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                                    Pix enviado
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </section>
      )}

      {/* Atos de Amor - Só se tiver desafios */}
      {atosAmorChallenges.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          {/* Header da Seção - Centralizado */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Atos de Amor</h2>
              <p className="text-gray-500 text-xs sm:text-sm">Espalhe amor e ganhe recompensas</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
            {atosAmorChallenges.map((challenge) => (
              <PhysicalChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={participationMap.get(challenge.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Desafios Físicos - Só se tiver desafios */}
      {physicalChallenges.length > 0 && (
        <section className="space-y-4 sm:space-y-6">
          {/* Header da Seção - Centralizado */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Dumbbell className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Desafios Físicos</h2>
              <p className="text-gray-500 text-xs sm:text-sm">Supere metas e mostre sua força</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
            {physicalChallenges.map((challenge) => (
              <PhysicalChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={participationMap.get(challenge.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* =============================================== */}
      {/* CATEGORIAS VAZIAS - Aparecem no final */}
      {/* =============================================== */}

      {/* Participe e Concorra - Em Breve */}
      {engagementChallenges.length === 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 opacity-60">
              <span className="text-2xl sm:text-3xl">🎁</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Participe e Concorra
                <span className="ml-2 text-sm font-medium text-purple-500">(em breve)</span>
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">Interaja no Instagram e ganhe prêmios em dinheiro</p>
            </div>
          </div>
          <Card className="max-w-2xl mx-auto p-6 text-center bg-purple-50/50 border-purple-100">
            <p className="text-gray-500 text-sm">Novos desafios de engajamento serão lançados em breve!</p>
          </Card>
        </section>
      )}

      {/* Atos de Amor - Em Breve */}
      {atosAmorChallenges.length === 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25 opacity-60">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Atos de Amor
                <span className="ml-2 text-sm font-medium text-rose-500">(em breve)</span>
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">Espalhe amor e ganhe recompensas</p>
            </div>
          </div>
          <Card className="max-w-2xl mx-auto p-6 text-center bg-rose-50/50 border-rose-100">
            <p className="text-gray-500 text-sm">Novos desafios de atos de amor serão lançados em breve!</p>
          </Card>
        </section>
      )}

      {/* Desafios Físicos - Em Breve */}
      {physicalChallenges.length === 0 && (
        <section className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 opacity-60">
              <Dumbbell className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Desafios Físicos
                <span className="ml-2 text-sm font-medium text-blue-500">(em breve)</span>
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm">Supere metas e mostre sua força</p>
            </div>
          </div>
          <Card className="max-w-2xl mx-auto p-6 text-center bg-blue-50/50 border-blue-100">
            <p className="text-gray-500 text-sm">Novos desafios físicos serão lançados em breve!</p>
          </Card>
        </section>
      )}

    </div>
  );
}
