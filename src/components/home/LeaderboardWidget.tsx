import { createClient } from '@/lib/supabase/server';
import { LeaderboardWidgetClient } from './LeaderboardWidgetClient';

interface RankingEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  balance: number;
}

export async function LeaderboardWidget() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: rankingData, error } = await supabase.rpc('get_ranking');

    if (error || !rankingData || rankingData.length === 0) {
      return <LeaderboardWidgetClient entries={[]} userId={user?.id ?? null} />;
    }

    const entries = (rankingData as RankingEntry[]).map((r, i) => ({
      user_id: r.user_id,
      full_name: r.full_name,
      avatar_url: r.avatar_url,
      email: r.email,
      balance: r.balance,
      position: i + 1,
    }));

    return <LeaderboardWidgetClient entries={entries} userId={user?.id ?? null} />;
  } catch (error) {
    console.error('LeaderboardWidget error:', error);
    return <LeaderboardWidgetClient entries={[]} userId={null} />;
  }
}
