import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { PhysicalChallengeCard } from '@/components/challenges';

type Challenge = {
  id: string;
  title: string;
  description: string;
  type: 'participe' | 'engajamento' | 'fisico';
  icon: string;
  is_active: boolean;
  instagram_embed_url?: string;
  prize_amount?: number;
  num_winners?: number;
  goal_type?: 'repetitions' | 'time';
  goal_value?: number;
  record_video_url?: string;
  hashtag?: string;
  profile_to_tag?: string;
  coins_reward: number;
  starts_at?: string;
  ends_at?: string;
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
    { data: userCoins }
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
    // Buscar participações do usuário
    supabase
      .from('challenge_participants')
      .select('challenge_id, status, result_value, coins_earned')
      .eq('user_id', user.id),
    // Buscar saldo de corações
    supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single()
  ]);

  const balance = userCoins?.balance || 0;

  // Mapa de participações
  const participationMap = new Map(
    (participations || []).map(p => [p.challenge_id, p])
  );

  // Agrupar por tipo
  const engagementChallenges = (challenges || []).filter(
    c => c.type === 'participe' || c.type === 'engajamento'
  );
  const physicalChallenges = (challenges || []).filter(c => c.type === 'fisico');

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

      {/* Saldo */}
      <Card className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-pink-100 text-sm">Seus corações</p>
            <p className="text-3xl font-bold">{balance} corações</p>
          </div>
          <div className="text-5xl">❤️</div>
        </div>
      </Card>

      {/* Desafios de Engajamento */}
      {engagementChallenges.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            🎁 Participe e Concorra
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engagementChallenges.map((challenge) => {
              const challengeWinners = (winners || []).filter(
                w => w.challenge_id === challenge.id
              );

              return (
                <Card key={challenge.id} className="overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-pink-500 to-red-500 p-4 text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{challenge.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold">{challenge.title}</h3>
                        {challenge.prize_amount && (
                          <p className="text-pink-100 text-sm">
                            Concorra a R$ {challenge.prize_amount.toFixed(2)} no Pix!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
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
                          <span className="text-gray-600">Deixe seu comentario criativo</span>
                        </li>
                        {challenge.num_winners && (
                          <li className="flex items-start gap-2">
                            <span className="text-pink-500">•</span>
                            <span className="text-gray-600">
                              {challenge.num_winners} ganhador(es) serao selecionados
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
                        className="block w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                      >
                        Ver post no Instagram 📲
                      </a>
                    )}

                    {/* Ganhadores */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">
                        🏆 Ganhadores
                      </h4>

                      {challengeWinners.length > 0 ? (
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
                      ) : (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <p className="text-gray-500 text-sm">Aguardando selecao...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Desafios Fisicos */}
      {physicalChallenges.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 justify-center">
            💪 Desafios Fisicos
          </h2>

          <div className="max-w-2xl mx-auto space-y-4">
            {physicalChallenges.map((challenge) => (
              <PhysicalChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={participationMap.get(challenge.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sem desafios */}
      {(!challenges || challenges.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nenhum desafio disponível
          </h2>
          <p className="text-gray-500">
            Novos desafios serao adicionados em breve!
          </p>
        </Card>
      )}
    </div>
  );
}
