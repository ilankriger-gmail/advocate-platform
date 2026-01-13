import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';

export default async function AdminEngajamentoPage() {
  const supabase = await createClient();

  // Buscar estatísticas de engajamento
  const [
    { count: totalVotes },
    { count: totalShares },
    { count: totalSaves },
    { count: totalComments },
  ] = await Promise.all([
    supabase.from('post_votes').select('*', { count: 'exact', head: true }),
    supabase.from('post_shares').select('*', { count: 'exact', head: true }),
    supabase.from('post_saves').select('*', { count: 'exact', head: true }),
    supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
  ]);

  // Posts mais votados
  const { data: topVotedPosts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      vote_score,
      media_url,
      author:users!posts_user_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'approved')
    .order('vote_score', { ascending: false })
    .limit(10);

  // Posts mais compartilhados
  const { data: topSharedPosts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      shares_count,
      media_url,
      author:users!posts_user_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'approved')
    .order('shares_count', { ascending: false })
    .limit(10);

  // Posts mais salvos
  const { data: topSavedPosts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      saves_count,
      media_url,
      author:users!posts_user_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'approved')
    .order('saves_count', { ascending: false })
    .limit(10);

  // Shares por plataforma
  const { data: sharesByPlatform } = await supabase
    .from('post_shares')
    .select('platform');

  const platformCounts = (sharesByPlatform || []).reduce((acc, share) => {
    const platform = share.platform || 'other';
    acc[platform] = (acc[platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Engajamento por dia (últimos 7 dias)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  const [
    { data: recentVotes },
    { data: recentShares },
    { data: recentSaves },
  ] = await Promise.all([
    supabase.from('post_votes').select('created_at').gte('created_at', sevenDaysAgoStr),
    supabase.from('post_shares').select('created_at').gte('created_at', sevenDaysAgoStr),
    supabase.from('post_saves').select('created_at').gte('created_at', sevenDaysAgoStr),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span className="text-3xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics de Engajamento</h1>
            <p className="text-gray-500 text-sm mt-0.5">Votos, compartilhamentos e salvos</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">❤️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{totalVotes || 0}</p>
              <p className="text-xs text-red-600">Total Votos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔗</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalShares || 0}</p>
              <p className="text-xs text-blue-600">Compartilhamentos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🔖</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">{totalSaves || 0}</p>
              <p className="text-xs text-yellow-600">Salvos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{totalComments || 0}</p>
              <p className="text-xs text-green-600">Comentários</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Últimos 7 dias */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Últimos 7 Dias</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-3xl font-bold text-red-600">{recentVotes?.length || 0}</p>
            <p className="text-sm text-red-700">Votos</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{recentShares?.length || 0}</p>
            <p className="text-sm text-blue-700">Compartilhamentos</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl">
            <p className="text-3xl font-bold text-yellow-600">{recentSaves?.length || 0}</p>
            <p className="text-sm text-yellow-700">Salvos</p>
          </div>
        </div>
      </Card>

      {/* Shares por Plataforma */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Compartilhamentos por Plataforma</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(platformCounts).map(([platform, count]) => (
            <Badge key={platform} className="bg-gray-100 text-gray-700 px-3 py-1.5">
              {platform === 'copy_link' && '🔗 Link'}
              {platform === 'twitter' && '🐦 Twitter'}
              {platform === 'whatsapp' && '💬 WhatsApp'}
              {platform === 'native' && '📱 Nativo'}
              {platform === 'other' && '📤 Outro'}
              {!['copy_link', 'twitter', 'whatsapp', 'native', 'other'].includes(platform) && `📤 ${platform}`}
              : <span className="font-bold ml-1">{count}</span>
            </Badge>
          ))}
          {Object.keys(platformCounts).length === 0 && (
            <p className="text-gray-500 text-sm">Nenhum compartilhamento registrado</p>
          )}
        </div>
      </Card>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Votados */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>❤️</span> Top Votados
          </h2>
          <div className="space-y-3">
            {(topVotedPosts || []).slice(0, 5).map((post, i) => (
              <PostRankingItem key={post.id} post={post} rank={i + 1} metric={post.vote_score || 0} metricLabel="votos" />
            ))}
            {(!topVotedPosts || topVotedPosts.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum post votado</p>
            )}
          </div>
        </Card>

        {/* Top Compartilhados */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔗</span> Top Compartilhados
          </h2>
          <div className="space-y-3">
            {(topSharedPosts || []).filter(p => p.shares_count > 0).slice(0, 5).map((post, i) => (
              <PostRankingItem key={post.id} post={post} rank={i + 1} metric={post.shares_count || 0} metricLabel="shares" />
            ))}
            {(!topSharedPosts || topSharedPosts.filter(p => p.shares_count > 0).length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum post compartilhado</p>
            )}
          </div>
        </Card>

        {/* Top Salvos */}
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🔖</span> Top Salvos
          </h2>
          <div className="space-y-3">
            {(topSavedPosts || []).filter(p => p.saves_count > 0).slice(0, 5).map((post, i) => (
              <PostRankingItem key={post.id} post={post} rank={i + 1} metric={post.saves_count || 0} metricLabel="saves" />
            ))}
            {(!topSavedPosts || topSavedPosts.filter(p => p.saves_count > 0).length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum post salvo</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface PostRankingItemProps {
  post: {
    id: string;
    content: string | null;
    media_url: string[] | null;
    author: { full_name: string | null; avatar_url: string | null } | { full_name: string | null; avatar_url: string | null }[] | null;
  };
  rank: number;
  metric: number;
  metricLabel: string;
}

function PostRankingItem({ post, rank, metric, metricLabel }: PostRankingItemProps) {
  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
        rank === 1 ? 'bg-yellow-400 text-yellow-900' :
        rank === 2 ? 'bg-gray-300 text-gray-700' :
        rank === 3 ? 'bg-orange-300 text-orange-900' :
        'bg-gray-200 text-gray-600'
      }`}>
        {rank}
      </div>
      {post.media_url && post.media_url.length > 0 ? (
        <img
          src={post.media_url[0]}
          alt=""
          className="w-10 h-10 rounded object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-xs">📝</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">
          {author?.full_name || 'Usuário'}
        </p>
        <p className="text-sm text-gray-700 truncate">
          {post.content?.slice(0, 40)}...
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">{metric}</p>
        <p className="text-[10px] text-gray-500">{metricLabel}</p>
      </div>
    </div>
  );
}
