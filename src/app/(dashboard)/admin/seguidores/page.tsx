import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';

export default async function AdminSeguidoresPage() {
  const supabase = await createClient();

  // Buscar estatísticas de seguidores
  const { count: totalFollows } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true });

  // Usuários com mais seguidores
  const { data: topFollowed } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, instagram_username, followers_count, is_creator, role')
    .order('followers_count', { ascending: false })
    .limit(15);

  // Usuários que mais seguem pessoas
  const { data: topFollowing } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, instagram_username, following_count')
    .order('following_count', { ascending: false })
    .limit(10);

  // Criadores
  const { data: creators } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, instagram_username, followers_count, is_creator')
    .eq('is_creator', true)
    .order('followers_count', { ascending: false });

  // Novos seguidores (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: recentFollows } = await supabase
    .from('user_follows')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sevenDaysAgo.toISOString());

  // Total de usuários com pelo menos 1 seguidor
  const usersWithFollowers = (topFollowed || []).filter(u => (u.followers_count || 0) > 0).length;

  // Média de seguidores
  const totalFollowersSum = (topFollowed || []).reduce((sum, u) => sum + (u.followers_count || 0), 0);
  const avgFollowers = topFollowed && topFollowed.length > 0
    ? Math.round(totalFollowersSum / topFollowed.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="text-3xl">👥</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grafo Social</h1>
            <p className="text-gray-500 text-sm mt-0.5">Seguidores e conexões da comunidade</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔗</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-700">{totalFollows || 0}</p>
              <p className="text-xs text-indigo-600">Conexões Totais</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📈</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{recentFollows || 0}</p>
              <p className="text-xs text-green-600">Últimos 7 dias</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">⭐</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{creators?.length || 0}</p>
              <p className="text-xs text-yellow-600">Criadores</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-red-50 border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-700">{avgFollowers}</p>
              <p className="text-xs text-pink-600">Média Seguidores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Criadores */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⭐</span> Criadores de Conteúdo
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(creators || []).map((creator) => (
            <Link
              key={creator.id}
              href={`/profile/${creator.id}`}
              className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl hover:shadow-md transition-shadow"
            >
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.full_name || 'Criador'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-yellow-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center ring-2 ring-yellow-400">
                  <span className="text-white text-xl font-bold">
                    {creator.full_name?.[0] || '?'}
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm font-medium text-gray-900 text-center truncate max-w-full">
                {creator.full_name || 'Criador'}
              </p>
              <Badge className="mt-1 bg-yellow-100 text-yellow-700 text-xs">
                {creator.followers_count || 0} seguidores
              </Badge>
            </Link>
          ))}
          {(!creators || creators.length === 0) && (
            <p className="text-gray-500 text-sm col-span-full text-center py-4">
              Nenhum criador cadastrado
            </p>
          )}
        </div>
      </Card>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Seguidos */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>👑</span> Mais Seguidos
          </h2>
          <div className="space-y-3">
            {(topFollowed || []).filter(u => (u.followers_count || 0) > 0).slice(0, 10).map((user, i) => (
              <UserRankingItem
                key={user.id}
                user={user}
                rank={i + 1}
                metric={user.followers_count || 0}
                metricLabel="seguidores"
              />
            ))}
            {(!topFollowed || topFollowed.filter(u => (u.followers_count || 0) > 0).length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum usuário com seguidores</p>
            )}
          </div>
        </Card>

        {/* Top Seguindo */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔍</span> Mais Ativos (seguindo)
          </h2>
          <div className="space-y-3">
            {(topFollowing || []).filter(u => (u.following_count || 0) > 0).slice(0, 10).map((user, i) => (
              <UserRankingItem
                key={user.id}
                user={user}
                rank={i + 1}
                metric={user.following_count || 0}
                metricLabel="seguindo"
              />
            ))}
            {(!topFollowing || topFollowing.filter(u => (u.following_count || 0) > 0).length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum usuário seguindo outros</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface UserRankingItemProps {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    instagram_username: string | null;
    is_creator?: boolean;
    role?: string;
  };
  rank: number;
  metric: number;
  metricLabel: string;
}

function UserRankingItem({ user, rank, metric, metricLabel }: UserRankingItemProps) {
  return (
    <Link
      href={`/profile/${user.id}`}
      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        rank === 1 ? 'bg-yellow-400 text-yellow-900' :
        rank === 2 ? 'bg-gray-300 text-gray-700' :
        rank === 3 ? 'bg-orange-300 text-orange-900' :
        'bg-gray-200 text-gray-600'
      }`}>
        {rank}
      </div>
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.full_name || 'Usuário'}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center">
          <span className="text-white text-sm font-bold">
            {user.full_name?.[0] || '?'}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user.full_name || 'Usuário'}
          </p>
          {user.is_creator && (
            <Badge className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5">⭐</Badge>
          )}
          {user.role === 'admin' && (
            <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5">Admin</Badge>
          )}
        </div>
        {user.instagram_username && (
          <p className="text-xs text-gray-500 truncate">@{user.instagram_username}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">{metric}</p>
        <p className="text-[10px] text-gray-500">{metricLabel}</p>
      </div>
    </Link>
  );
}
