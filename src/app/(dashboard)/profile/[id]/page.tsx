import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublicProfile } from '@/actions/profile';
import { getPublicProfileById, checkIsFollowing, getProfileStatsById } from '@/actions/social';
import { getPosts } from '@/lib/supabase/queries';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Avatar, Badge } from '@/components/ui';
import { PostCard } from '@/components/posts/PostCard';
import { FollowButton } from '@/components/social/FollowButton';
import { formatDate } from '@/lib/utils';


export const dynamic = 'force-dynamic';
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Se e o proprio perfil, redireciona para /profile
  if (id === user.id) {
    redirect('/profile');
  }

  const profile = await getPublicProfile(id);

  if (!profile) {
    notFound();
  }

  // Buscar estatísticas públicas e status de follow em paralelo
  const [stats, isFollowing] = await Promise.all([
    getProfileStatsById(id),
    checkIsFollowing(id),
  ]);

  // Buscar posts aprovados do usuário
  const posts = await getPosts({ userId: id, status: 'approved' });

  const name = profile.full_name || 'Usuário';
  const isCreator = profile.is_creator || false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        breadcrumbs={[
          { label: 'Perfis' },
          { label: name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Card do Perfil */}
          <Card className="p-6 text-center">
            <Avatar name={name} src={profile.avatar_url} size="xl" className="mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">{name}</h2>
            {isCreator && (
              <Badge variant="primary" className="mt-3">
                Criador
              </Badge>
            )}

            {/* Botão Seguir */}
            <div className="mt-4">
              <FollowButton
                userId={id}
                initialIsFollowing={isFollowing}
              />
            </div>

            {/* Contadores de Seguidores */}
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="text-center">
                <span className="font-bold text-gray-900">{stats?.followers_count || 0}</span>
                <span className="text-gray-500 ml-1">seguidores</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900">{stats?.following_count || 0}</span>
                <span className="text-gray-500 ml-1">seguindo</span>
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 text-sm text-gray-600">{profile.bio}</p>
            )}

            {/* Social Links */}
            <div className="mt-4 flex justify-center gap-3">
              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {profile.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-black hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </a>
              )}
              {profile.youtube_handle && (
                <a
                  href={`https://youtube.com/@${profile.youtube_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {profile.twitter_handle && (
                <a
                  href={`https://twitter.com/${profile.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </a>
              )}
            </div>
          </Card>

          {/* Estatisticas Publicas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatisticas</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Posts Aprovados</span>
                <span className="font-medium">{stats?.posts_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Curtidas Recebidas</span>
                <span className="font-medium text-pink-500">{stats?.total_likes || 0}</span>
              </div>
            </div>
          </Card>

          {/* Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Membro desde</span>
                <span className="text-gray-700">{formatDate(profile.created_at)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Posts */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Posts ({posts.length})
            </h3>

            {posts.length === 0 ? (
              <Card className="p-6">
                <div className="text-center py-8 text-gray-500">
                  <p>Este usuário ainda não tem posts aprovados.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
