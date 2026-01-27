import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  score: number;
  position: number;
}

// Função para buscar top usuários e posição do usuário atual
async function getLeaderboardData(currentUserId?: string): Promise<{
  topUsers: LeaderboardEntry[];
  userPosition: number | null;
  userScore: number;
  nearbyUsers: LeaderboardEntry[];
}> {
  const supabase = await createClient();

  // Buscar todos os usuários ordenados por balance
  const { data: allCoins } = await supabase
    .from('user_coins')
    .select('user_id, balance')
    .order('balance', { ascending: false });

  if (!allCoins || allCoins.length === 0) {
    return { topUsers: [], userPosition: null, userScore: 0, nearbyUsers: [] };
  }

  // Encontrar posição do usuário atual
  const userIndex = currentUserId 
    ? allCoins.findIndex(c => c.user_id === currentUserId)
    : -1;
  const userPosition = userIndex >= 0 ? userIndex + 1 : null;
  const userScore = userIndex >= 0 ? allCoins[userIndex].balance : 0;

  // Buscar informações dos usuários
  const userIds = allCoins.map(u => u.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (!users) return { topUsers: [], userPosition, userScore, nearbyUsers: [] };

  const usersMap = new Map(users.map(u => [u.id, u]));

  // Montar lista completa com posições
  const fullList = allCoins
    .map((coin, index) => {
      const user = usersMap.get(coin.user_id);
      return {
        id: coin.user_id,
        full_name: user?.full_name || 'Usuário',
        avatar_url: user?.avatar_url || null,
        score: coin.balance || 0,
        position: index + 1,
      };
    })
    .filter(entry => entry.score > 0);

  // Top 3
  const topUsers = fullList.slice(0, 3);

  // Usuários próximos (se não está no top 3)
  let nearbyUsers: LeaderboardEntry[] = [];
  if (userPosition && userPosition > 3) {
    const start = Math.max(0, userPosition - 2); // 1 acima
    const end = Math.min(fullList.length, userPosition + 1); // 1 abaixo (inclui o usuário)
    nearbyUsers = fullList.slice(start, end);
  }

  return { topUsers, userPosition, userScore, nearbyUsers };
}

// Ícone de medalha baseado na posição
function RankBadge({ rank }: { rank: number }) {
  const badges: Record<number, { emoji: string; color: string }> = {
    1: { emoji: '🥇', color: 'text-yellow-500' },
    2: { emoji: '🥈', color: 'text-gray-400' },
    3: { emoji: '🥉', color: 'text-amber-600' },
  };

  const badge = badges[rank];

  if (badge) {
    return <span className={`text-xl ${badge.color}`}>{badge.emoji}</span>;
  }

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
    
    const { topUsers, userPosition, userScore, nearbyUsers } = await getLeaderboardData(user?.id);

  if (topUsers.length === 0) {
    // Mostrar widget mesmo vazio para debug
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🏆</span>
            Top Embaixadores
          </h3>
          <Link
            href="/ranking"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Ver ranking
          </Link>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Nenhum embaixador ainda. Seja o primeiro! 💪
        </p>
      </Card>
    );
  }

  const isInTop3 = userPosition && userPosition <= 3;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          Top Embaixadores
        </h3>
        <Link
          href="/ranking"
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Ver ranking
        </Link>
      </div>

      {/* Top 3 */}
      <div className="space-y-2">
        {topUsers.map((entry) => (
          <Link
            key={entry.id}
            href={`/profile/${entry.id}`}
            className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
              entry.id === user?.id 
                ? 'bg-purple-50 border border-purple-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <RankBadge rank={entry.position} />
            <Avatar
              name={entry.full_name || 'Usuário'}
              src={entry.avatar_url || undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">
                {entry.full_name || 'Usuário'}
                {entry.id === user?.id && (
                  <span className="ml-1 text-xs text-purple-600">(você)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-pink-600">
              <span>❤️</span>
              {entry.score}
            </div>
          </Link>
        ))}
      </div>

      {/* Sua posição (se não está no top 3) */}
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
                key={entry.id}
                href={`/profile/${entry.id}`}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                  entry.id === user?.id 
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <RankBadge rank={entry.position} />
                <Avatar
                  name={entry.full_name || 'Usuário'}
                  src={entry.avatar_url || undefined}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate text-sm ${
                    entry.id === user?.id ? 'text-purple-700' : 'text-gray-900'
                  }`}>
                    {entry.full_name || 'Usuário'}
                    {entry.id === user?.id && (
                      <span className="ml-1 text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                        você
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-pink-600">
                  <span>❤️</span>
                  {entry.score}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Se usuário não tem posição ainda */}
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
          <Link
            href="/ranking"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            Ver ranking
          </Link>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Carregando ranking... 
        </p>
      </Card>
    );
  }
}
