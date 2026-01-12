import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStats, getUserPosts } from '@/lib/supabase/queries';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Avatar, Badge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { LeaderboardPreview } from '@/components/leaderboard';

/**
 * Dashboard principal - exibe estatisticas e acoes rapidas
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Buscar estatisticas e posts
  const [stats, recentPosts] = await Promise.all([
    getUserStats(user.id),
    getUserPosts(user.id, 3),
  ]);

  // Dados do usuário
  const name = profile?.full_name || user.user_metadata?.full_name || 'Usuário';
  const email = user.email;
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const isCreator = profile?.is_creator || false;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua conta"
      />

      {/* Card de Boas-vindas */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <Avatar name={name} src={avatarUrl} size="lg" />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Bem-vindo, {name.split(' ')[0]}!
              </h2>
              {isCreator && (
                <Badge variant="primary">Criador</Badge>
              )}
            </div>
            <p className="text-gray-500 text-sm">{email}</p>
          </div>
          <Link
            href="/profile"
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-center"
          >
            Ver Perfil
          </Link>
        </div>
      </Card>

      {/* Grid de Estatisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Posts */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Posts</span>
            <span className="text-xl sm:text-2xl">📝</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">
            {stats?.approved_posts || 0}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            de {stats?.total_posts || 0} total
          </p>
        </Card>

        {/* Curtidas */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Curtidas</span>
            <span className="text-xl sm:text-2xl">❤️</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-pink-500">
            {stats?.total_likes || 0}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            nos seus posts
          </p>
        </Card>

        {/* Membro desde */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-500">Membro</span>
            <span className="text-xl sm:text-2xl">👤</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-700">
            {profile?.created_at ? formatRelativeTime(profile.created_at) : 'Recentemente'}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            na comunidade
          </p>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Ações Rápidas
        </h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <Link
            href="/feed/new"
            className="min-h-[44px] px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Criar Post
          </Link>
          <Link
            href="/feed"
            className="min-h-[44px] px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Ver Feed
          </Link>
          <Link
            href="/profile/edit"
            className="min-h-[44px] px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Editar Perfil
          </Link>
        </div>
      </Card>

      {/* Leaderboard Preview */}
      <LeaderboardPreview currentUserId={user.id} />

      {/* Posts Recentes */}
      {recentPosts.length > 0 && (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Seus Posts Recentes
            </h3>
            <Link href="/profile" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 min-h-[44px] flex items-center">
              Ver todos
            </Link>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                {post.media_url && post.media_url[0] && (
                  <img
                    src={post.media_url[0]}
                    alt={post.title}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{post.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                    <span>{formatRelativeTime(post.created_at)}</span>
                    <span className="flex items-center gap-1">
                      <span>❤️</span> {post.likes_count}
                    </span>
                    <Badge
                      variant={post.status === 'approved' ? 'success' : post.status === 'pending' ? 'warning' : 'error'}
                      size="sm"
                    >
                      {post.status === 'approved' ? 'Aprovado' : post.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
