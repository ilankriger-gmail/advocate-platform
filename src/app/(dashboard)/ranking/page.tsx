import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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
  // Usar admin client para bypasear RLS e ver dados de todos os usuários
  const supabase = createAdminClient();

  // Buscar todos os usuários com coins, ordenados por balance
  const { data: allCoins, error } = await supabase
    .from('user_coins')
    .select('user_id, balance')
    .order('balance', { ascending: false });

  if (error || !allCoins) {
    console.error('Error fetching coins:', error);
    return { ranking: [], userPosition: null, userBalance: 0 };
  }

  // Buscar posições anteriores (de ontem)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const { data: previousPositions } = await supabase
    .from('ranking_history')
    .select('user_id, position')
    .eq('recorded_at', yesterdayStr);
  
  const previousMap = new Map(previousPositions?.map(p => [p.user_id, p.position]) || []);

  // Encontrar a posição do usuário atual
  const userIndex = allCoins.findIndex(c => c.user_id === currentUserId);
  const userPosition = userIndex >= 0 ? userIndex + 1 : null;
  const userBalance = userIndex >= 0 ? allCoins[userIndex].balance : 0;

  // Buscar informações de todos os usuários
  const userIds = allCoins.map(c => c.user_id);
  
  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url')
    .in('id', userIds);

  const usersMap = new Map(users?.map(u => [u.id, u]) || []);

  // Montar o ranking completo
  const ranking = allCoins.map((coin, index) => {
    const user = usersMap.get(coin.user_id);
    
    const displayName = user?.full_name || 
      (user?.email ? user.email.split('@')[0] : `Membro #${index + 1}`);
    
    const avatarUrl = user?.avatar_url || null;
    
    return {
      position: index + 1,
      userId: coin.user_id,
      fullName: displayName,
      username: null,
      avatarUrl,
      balance: coin.balance || 0,
      isCurrentUser: coin.user_id === currentUserId,
      previousPosition: previousMap.get(coin.user_id) || null,
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
        description="Veja quem está brilhando na comunidade"
      />

      <RankingList 
        ranking={ranking} 
        userPosition={userPosition}
        userBalance={userBalance}
        totalUsers={ranking.length}
      />
    </div>
  );
}
