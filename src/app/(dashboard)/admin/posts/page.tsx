import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { PostModerationCard } from './PostModerationCard';

type PostStatus = 'pending' | 'approved' | 'rejected';

interface PageProps {
  searchParams: Promise<{ status?: PostStatus }>;
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || 'pending';
  const supabase = await createClient();

  // Buscar posts com filtro de status
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        instagram_username
      )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false });

  // Contar posts por status
  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  const tabs = [
    { value: 'pending', label: 'Pendentes', count: pendingCount || 0, color: 'yellow' },
    { value: 'approved', label: 'Aprovados', count: approvedCount || 0, color: 'green' },
    { value: 'rejected', label: 'Rejeitados', count: rejectedCount || 0, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderacao de Posts</h1>
          <p className="text-gray-500 text-sm mt-1">Aprove ou rejeite posts dos usuarios</p>
        </div>
      </div>

      {/* Tabs de Status */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const isActive = status === tab.value;
          const colorClasses = {
            yellow: isActive ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
            green: isActive ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
            red: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
          };

          return (
            <a
              key={tab.value}
              href={`/admin/posts?status=${tab.value}`}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${colorClasses[tab.color as keyof typeof colorClasses]}`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            </a>
          );
        })}
      </div>

      {/* Lista de Posts */}
      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <PostModerationCard
              key={post.id}
              post={post}
              profile={post.profiles as { id: string; full_name: string; avatar_url: string; instagram_username: string } | null}
              status={status}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">
            {status === 'pending' ? '✅' : status === 'approved' ? '📝' : '🚫'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {status === 'pending'
              ? 'Nenhum post pendente'
              : status === 'approved'
              ? 'Nenhum post aprovado'
              : 'Nenhum post rejeitado'}
          </h2>
          <p className="text-gray-500">
            {status === 'pending'
              ? 'Todos os posts foram moderados!'
              : 'Nenhum post encontrado com este status.'}
          </p>
        </Card>
      )}
    </div>
  );
}
