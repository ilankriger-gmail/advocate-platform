import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { UnifiedPostCard } from './UnifiedPostCard';

type FilterType = 'pending' | 'blocked' | 'help_request' | 'approved' | 'rejected';

interface PageProps {
  searchParams: Promise<{ filter?: FilterType }>;
}

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter || 'pending';
  const supabase = await createClient();

  // Buscar posts baseado no filtro
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_user_id_fkey (
        id,
        full_name,
        avatar_url,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (filter === 'help_request') {
    // Mostra TODOS os pedidos de ajuda, independente do status
    query = query.eq('content_category', 'help_request');
  } else {
    query = query.eq('status', filter);
  }

  const { data: posts } = await query;

  // Contar posts por filtro
  const [
    { count: pendingCount },
    { count: blockedCount },
    { count: helpRequestCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('content_category', 'help_request'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
  ]);

  const tabs = [
    { value: 'pending', label: 'Pendentes', count: pendingCount || 0, color: 'yellow', icon: '⏳' },
    { value: 'blocked', label: 'Bloqueados', count: blockedCount || 0, color: 'red', icon: '🛡️' },
    { value: 'help_request', label: 'Pedidos de Ajuda', count: helpRequestCount || 0, color: 'blue', icon: '🆘' },
    { value: 'approved', label: 'Aprovados', count: approvedCount || 0, color: 'green', icon: '✅' },
    { value: 'rejected', label: 'Rejeitados', count: rejectedCount || 0, color: 'gray', icon: '🚫' },
  ];

  const getFilterDescription = () => {
    switch (filter) {
      case 'pending':
        return 'Posts aguardando revisão. Foram sinalizados pela moderação automática mas não foram bloqueados.';
      case 'blocked':
        return 'Conteúdo bloqueado pela IA (Sightengine/Perspective API). Aprove manualmente se for falso positivo.';
      case 'help_request':
        return 'Posts classificados como pedidos de ajuda (financeira, médica, etc). Aparecem na aba "Pedidos de Ajuda" do feed.';
      case 'approved':
        return 'Posts aprovados e visíveis no feed da comunidade.';
      case 'rejected':
        return 'Posts rejeitados pela moderação. Não são visíveis no feed.';
      default:
        return '';
    }
  };

  const getEmptyState = () => {
    switch (filter) {
      case 'pending':
        return { icon: '✅', title: 'Nenhum post pendente', desc: 'Todos os posts foram revisados!' };
      case 'blocked':
        return { icon: '✅', title: 'Nenhum post bloqueado', desc: 'A moderação automática está funcionando corretamente!' };
      case 'help_request':
        return { icon: '📭', title: 'Nenhum pedido de ajuda', desc: 'Nenhum post com pedido de ajuda no momento.' };
      case 'approved':
        return { icon: '📝', title: 'Nenhum post aprovado', desc: 'Nenhum post aprovado ainda.' };
      case 'rejected':
        return { icon: '🚫', title: 'Nenhum post rejeitado', desc: 'Nenhum post foi rejeitado.' };
      default:
        return { icon: '📝', title: 'Nenhum post', desc: '' };
    }
  };

  const colorClasses: Record<string, { active: string; inactive: string }> = {
    yellow: { active: 'bg-yellow-500 text-white', inactive: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
    red: { active: 'bg-red-500 text-white', inactive: 'bg-red-50 text-red-700 hover:bg-red-100' },
    blue: { active: 'bg-blue-500 text-white', inactive: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    green: { active: 'bg-green-500 text-white', inactive: 'bg-green-50 text-green-700 hover:bg-green-100' },
    gray: { active: 'bg-gray-500 text-white', inactive: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
  };

  const emptyState = getEmptyState();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderação de Posts</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie todos os posts da comunidade
          </p>
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = filter === tab.value;
          const colors = colorClasses[tab.color];

          return (
            <a
              key={tab.value}
              href={`/admin/posts?filter=${tab.value}`}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive ? colors.active : colors.inactive}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            </a>
          );
        })}
      </div>

      {/* Descrição do filtro atual */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <p className="text-sm text-gray-600">{getFilterDescription()}</p>
      </Card>

      {/* Lista de Posts */}
      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <UnifiedPostCard
              key={post.id}
              post={post}
              author={post.author as { id: string; full_name: string | null; avatar_url: string | null; email: string } | null}
              filter={filter}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">{emptyState.icon}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{emptyState.title}</h2>
          <p className="text-gray-500">{emptyState.desc}</p>
        </Card>
      )}
    </div>
  );
}
