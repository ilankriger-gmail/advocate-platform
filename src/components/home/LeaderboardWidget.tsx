import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

interface LeaderboardEntry {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  score: number;
}

// Função para buscar top usuários
async function getTopUsers(limit = 5): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  // Buscar usuários com saldo de moedas
  const { data: usersWithCoins } = await supabase
    .from('user_coins')
    .select('user_id, balance')
    .order('balance', { ascending: false })
    .limit(limit);

  if (!usersWithCoins || usersWithCoins.length === 0) {
    return [];
  }

  // Buscar informações dos usuários
  const userIds = usersWithCoins.map((u) => u.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);

  if (!users) return [];

  // Combinar dados
  const usersMap = new Map(users.map((u) => [u.id, u]));

  return usersWithCoins
    .map((coin) => {
      const user = usersMap.get(coin.user_id);
      return {
        id: coin.user_id,
        full_name: user?.full_name || 'Usuário',
        avatar_url: user?.avatar_url || null,
        score: coin.balance || 0,
      };
    })
    .filter((entry) => entry.score > 0);
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
  const topUsers = await getTopUsers(5);

  if (topUsers.length === 0) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          Top Embaixadores
        </h3>
        <Link
          href="/ranking"
          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          Ver todos
        </Link>
      </div>

      <div className="space-y-3">
        {topUsers.map((user, index) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RankBadge rank={index + 1} />
            <Avatar
              name={user.full_name || 'Usuário'}
              src={user.avatar_url || undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate text-sm">
                {user.full_name || 'Usuário'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              {user.score}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
