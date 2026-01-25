import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserStats, getPosts } from '@/lib/supabase/queries';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Avatar, Badge } from '@/components/ui';
import { PostCard } from '@/components/posts/PostCard';
import { MeusDesafios } from '@/components/challenges/MeusDesafios';
import { formatDate } from '@/lib/utils';


export const dynamic = 'force-dynamic';
export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar perfil
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // Buscar saldo de moedas
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  // Buscar estatisticas
  const stats = await getUserStats(user.id);

  // Buscar posts do usuário
  const posts = await getPosts({ userId: user.id });

  const name = profile?.full_name || user.user_metadata?.full_name || 'Usuário';
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const isCreator = profile?.is_creator || false;
  const balance = userCoins?.balance || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header do Perfil - Similar ao Banner da Home */}
      <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white">
        <Avatar name={name} src={avatarUrl} size="lg" className="mx-auto mb-3 sm:mb-4 ring-4 ring-white/30 sm:!w-24 sm:!h-24" />
        <h1 className="text-xl sm:text-2xl font-bold">{name}</h1>
        <p className="text-white/70 text-xs sm:text-sm">{user.email}</p>
        {isCreator && (
          <Badge variant="primary" className="mt-2 sm:mt-3 bg-white/20 text-white border-white/30">
            Criador
          </Badge>
        )}
        {profile?.bio && (
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/80 max-w-md mx-auto">{profile.bio}</p>
        )}

        {/* Followers/Following */}
        <div className="mt-3 sm:mt-4 flex justify-center gap-6 sm:gap-8">
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold">{profile?.followers_count || 0}</p>
            <p className="text-xs sm:text-sm text-white/70">Seguidores</p>
          </div>
          <div className="text-center">
            <p className="text-lg sm:text-xl font-bold">{profile?.following_count || 0}</p>
            <p className="text-xs sm:text-sm text-white/70">Seguindo</p>
          </div>
        </div>

        {/* Social Links - min-h-[44px] para touch target */}
        <div className="mt-3 sm:mt-4 flex justify-center gap-3">
          {profile?.instagram_handle && (
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[44px] min-h-[44px] p-2.5 sm:p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}
          {profile?.tiktok_handle && (
            <a
              href={`https://tiktok.com/@${profile.tiktok_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-[44px] min-h-[44px] p-2.5 sm:p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </a>
          )}
        </div>

        {/* Ações - min-h-[44px] para touch target */}
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
          <Link
            href="/perfil/editar"
            className="min-h-[44px] px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors inline-flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Perfil
          </Link>
          <Link
            href="/perfil/novo-post"
            className="min-h-[44px] px-4 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Post
          </Link>
        </div>
      </Card>

      {/* Layout igual à Home: Feed centralizado + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Feed Principal - Centralizado */}
        <main className="lg:col-span-8 order-2 lg:order-1">
          <div className="max-w-[500px] mx-auto">
            {/* Header dos Posts */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Meus Posts ({posts.length})
              </h2>
            </div>

            {posts.length === 0 ? (
              <Card className="p-6 sm:p-8 text-center">
                <p className="text-gray-500 mb-4 text-sm sm:text-base">Você ainda não criou nenhum post.</p>
                <Link
                  href="/perfil/novo-post"
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Criar primeiro post
                </Link>
              </Card>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isOwner={true}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar - Estatísticas e Info */}
        <aside className="lg:col-span-4 order-1 lg:order-2">
          <div className="lg:sticky lg:top-20 space-y-3 sm:space-y-4">
            {/* Saldo de Moedas */}
            <Card className="p-3 sm:p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs sm:text-sm">Seus corações</p>
                  <p className="text-xl sm:text-2xl font-bold">{balance} ❤️</p>
                </div>
                <Link href="/premios" className="text-white/80 hover:text-white text-xs sm:text-sm underline min-h-[44px] flex items-center">
                  Ver prêmios
                </Link>
              </div>
            </Card>

            {/* Estatísticas */}
            <Card className="p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Estatísticas</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Posts</span>
                  <span className="font-medium">{stats?.total_posts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Aprovados</span>
                  <span className="font-medium text-green-600">{stats?.approved_posts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Curtidas</span>
                  <span className="font-medium text-pink-500">{stats?.total_likes || 0}</span>
                </div>
              </div>
            </Card>

            {/* Meus Desafios */}
            <MeusDesafios userId={user.id} />

            {/* Info */}
            <Card className="p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Informações</h3>
              <div className="text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Membro desde</span>
                  <span className="text-gray-700">{formatDate(profile?.created_at || user.created_at)}</span>
                </div>
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
