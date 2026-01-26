import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { RankingList } from '@/components/ranking/RankingList';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_ranking_title',
    'seo_ranking_description',
  ]);

  return {
    title: settings.seo_ranking_title || 'Ranking',
    description: settings.seo_ranking_description || 'Veja sua posição no ranking da comunidade',
  };
}

// Buscar todos os usuários com coins e suas posições
async function getRankingData(currentUserId: string) {
  const supabase = await createClient();

  // Buscar todos os usuários com coins, ordenados por balance
  const { data: allCoins, error } = await supabase
    .from('user_coins')
    .select('user_id, balance')
    .order('balance', { ascending: false });

  if (error || !allCoins) {
    console.error('Error fetching coins:', error);
    return { ranking: [], userPosition: null, userBalance: 0 };
  }

  // Encontrar a posição do usuário atual
  const userIndex = allCoins.findIndex(c => c.user_id === currentUserId);
  const userPosition = userIndex >= 0 ? userIndex + 1 : null;
  const userBalance = userIndex >= 0 ? allCoins[userIndex].balance : 0;

  // Buscar informações de todos os usuários
  const userIds = allCoins.map(c => c.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, username')
    .in('id', userIds);

  const usersMap = new Map(users?.map(u => [u.id, u]) || []);

  // Montar o ranking completo
  const ranking = allCoins.map((coin, index) => {
    const user = usersMap.get(coin.user_id);
    return {
      position: index + 1,
      userId: coin.user_id,
      fullName: user?.full_name || 'Usuário',
      username: user?.username || null,
      avatarUrl: user?.avatar_url || null,
      balance: coin.balance || 0,
      isCurrentUser: coin.user_id === currentUserId,
    };
  }).filter(entry => entry.balance > 0);

  return { ranking, userPosition, userBalance };
}

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { ranking, userPosition, userBalance } = await getRankingData(user.id);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Ranking"
        description="Veja sua posição na comunidade"
      />

      {/* Card com sua posição */}
      {userPosition && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-1">
          <div className="relative bg-white rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Sua posição</p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-gray-900">#{userPosition}</span>
                  <span className="text-gray-400">de {ranking.length}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Seus corações</p>
                <div className="flex items-center gap-2 text-2xl font-bold text-pink-600">
                  <span>❤️</span>
                  <span>{userBalance}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de ranking */}
      <RankingList 
        ranking={ranking} 
        userPosition={userPosition}
        totalUsers={ranking.length}
      />
    </div>
  );
}
