import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

interface RankingEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  balance: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
      {rank}
    </span>
  );
}

export async function LeaderboardWidget() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Single RPC — JOIN server-side, SECURITY DEFINER, no URL issues
    const { data: rankingData, error } = await supabase.rpc('get_ranking');

    if (error || !rankingData || rankingData.length === 0) {
      return (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Top Embaixadores
            </h3>
            <Link href="/ranking" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
              Ver ranking
            </Link>
          </div>
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum embaixador ainda. Seja o primeiro! 💪
          </p>
        </Card>
      );
    }

    const top3 = rankingData.slice(0, 3) as RankingEntry[];
    
    // Find user position
    const userIndex = user ? rankingData.findIndex((r: RankingEntry) => r.user_id === user.id) : -1;
    const userPosition = userIndex >= 0 ? userIndex + 1 : null;
    const isInTop3 = userPosition !== null && userPosition <= 3;

    // Nearby users (if not in top 3)
    let nearbyUsers: (RankingEntry & { position: number })[] = [];
    if (userPosition && userPosition > 3) {
      const start = Math.max(0, userPosition - 2);
      const end = Math.min(rankingData.length, userPosition + 1);
      nearbyUsers = rankingData.slice(start, end).map((r: RankingEntry, i: number) => ({
        ...r,
        position: start + i + 1,
      }));
    }

    const getName = (entry: RankingEntry) => 
      entry.full_name || (entry.email ? entry.email.split('@')[0] : 'Usuário');

    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Top Embaixadores
          </h3>
          <Link href="/ranking" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            Ver ranking
          </Link>
        </div>

        {/* Top 3 */}
        <div className="space-y-2">
          {top3.map((entry, index) => (
            <Link
              key={entry.user_id}
              href={`/profile/${entry.user_id}`}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                entry.user_id === user?.id 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <RankBadge rank={index + 1} />
              <Avatar
                name={getName(entry)}
                src={entry.avatar_url || undefined}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm">
                  {getName(entry)}
                  {entry.user_id === user?.id && (
                    <span className="ml-1 text-xs text-purple-600">(você)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-pink-600">
                <span>❤️</span>
                {entry.balance}
              </div>
            </Link>
          ))}
        </div>

        {/* User position if not in top 3 */}
        {!isInTop3 && userPosition && nearbyUsers.length > 0 && (
          <>
            <div className="my-3 flex items-center gap-2">
              <div className="flex-1 border-t border-dashed border-gray-200" />
              <span className="text-xs text-gray-400">sua posição</span>
              <div className="flex-1 border-t border-dashed border-gray-200" />
            </div>
            <div className="space-y-2">
              {nearbyUsers.map((entry) => (
                <Link
                  key={entry.user_id}
                  href={`/profile/${entry.user_id}`}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                    entry.user_id === user?.id 
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <RankBadge rank={entry.position} />
                  <Avatar
                    name={getName(entry)}
                    src={entry.avatar_url || undefined}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate text-sm ${
                      entry.user_id === user?.id ? 'text-purple-700' : 'text-gray-900'
                    }`}>
                      {getName(entry)}
                      {entry.user_id === user?.id && (
                        <span className="ml-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                          você
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-pink-600">
                    <span>❤️</span>
                    {entry.balance}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {!userPosition && user && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-500">
              Complete desafios para aparecer no ranking! 💪
            </p>
          </div>
        )}
      </Card>
    );
  } catch (error) {
    console.error('LeaderboardWidget error:', error);
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Top Embaixadores
          </h3>
          <Link href="/ranking" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
            Ver ranking
          </Link>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">Carregando ranking...</p>
      </Card>
    );
  }
}
