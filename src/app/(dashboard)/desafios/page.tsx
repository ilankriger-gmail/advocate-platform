import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui';
import { PhysicalChallengeCard } from '@/components/challenges';

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

      {/* Saldo - Card Premium */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-pink-100 text-sm font-medium tracking-wide uppercase">Seus coracoes</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-black tracking-tight">{balance}</p>
                <p className="text-xl font-medium text-pink-100">coracoes</p>
              </div>
              <p className="text-pink-200 text-sm mt-2">Complete desafios para ganhar mais!</p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-white/20 rounded-full" />
              <div className="relative w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center">
                <span className="text-5xl">❤️</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Desafios de Engajamento */}
      {engagementChallenges.length > 0 && (
        <section className="space-y-6">
          {/* Header da Secao */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Participe e Concorra</h2>
              <p className="text-gray-500 text-sm">Interaja no Instagram e ganhe premios em dinheiro</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </section>
      )}

      {/* Desafios Fisicos */}
      {physicalChallenges.length > 0 && (
        <section className="space-y-6">
          {/* Header da Secao */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-2xl">💪</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Desafios Fisicos</h2>
              <p className="text-gray-500 text-sm">Supere metas e mostre sua forca</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4">
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

      {/* Sem desafios */}
      {(!challenges || challenges.length === 0) && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
          <div className="relative p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Nenhum desafio disponivel
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Fique atento! Novos desafios serao adicionados em breve para voce participar e ganhar coracoes.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
