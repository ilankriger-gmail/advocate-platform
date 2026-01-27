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

async function getRankingData(currentUserId: string) {
  const supabase = await createClient();

  // Single RPC call — does JOIN server-side, no URL length issues, SECURITY DEFINER bypasses RLS
  const { data: rankingData, error } = await supabase.rpc('get_ranking');

  if (error || !rankingData) {
    console.error('Error fetching ranking:', error);
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

  // Montar ranking com posições
  const ranking = rankingData.map((entry: { user_id: string; full_name: string | null; avatar_url: string | null; email: string | null; balance: number }, index: number) => ({
    position: index + 1,
    userId: entry.user_id,
    fullName: entry.full_name || (entry.email ? entry.email.split('@')[0] : `Membro #${index + 1}`),
    username: null,
    avatarUrl: entry.avatar_url || null,
    balance: entry.balance || 0,
    isCurrentUser: entry.user_id === currentUserId,
    previousPosition: previousMap.get(entry.user_id) || null,
  }));

  // Posição do usuário atual
  const userIndex = ranking.findIndex((r: { isCurrentUser: boolean }) => r.isCurrentUser);
  const userPosition = userIndex >= 0 ? userIndex + 1 : null;
  const userBalance = userIndex >= 0 ? ranking[userIndex].balance : 0;

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
