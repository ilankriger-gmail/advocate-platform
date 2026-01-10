import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { ModerationCard } from './ModerationCard';

type FilterType = 'blocked' | 'help_request' | 'pending';

interface PageProps {
  searchParams: Promise<{ filter?: FilterType }>;
}

export default async function AdminModeracaoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = params.filter || 'blocked';
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

  if (filter === 'blocked') {
    query = query.eq('status', 'blocked');
  } else if (filter === 'help_request') {
    query = query.eq('content_category', 'help_request').eq('status', 'approved');
  } else {
    query = query.eq('status', 'pending');
  }

  const { data: posts } = await query;

  // Contar posts por filtro
  const [
    { count: blockedCount },
    { count: helpRequestCount },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'blocked'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('content_category', 'help_request').eq('status', 'approved'),
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const tabs = [
    { value: 'blocked', label: 'Bloqueados pela IA', count: blockedCount || 0, color: 'red', icon: '🛡️' },
    { value: 'help_request', label: 'Pedidos de Ajuda', count: helpRequestCount || 0, color: 'blue', icon: '🆘' },
    { value: 'pending', label: 'Pendentes', count: pendingCount || 0, color: 'yellow', icon: '⏳' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderacao de Conteudo</h1>
          <p className="text-gray-500 text-sm mt-1">
            Revise posts bloqueados pela IA e pedidos de ajuda
          </p>
        </div>
      </div>

      {/* Tabs de Filtro */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = filter === tab.value;
          const colorClasses = {
            red: isActive ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100',
            blue: isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
            yellow: isActive ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
          };

          return (
            <a
              key={tab.value}
              href={`/admin/moderacao?filter=${tab.value}`}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${colorClasses[tab.color as keyof typeof colorClasses]}`}
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

      {/* Informacao sobre o filtro atual */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <div className="text-sm text-gray-600">
          {filter === 'blocked' && (
            <>
              <strong>Posts Bloqueados:</strong> Conteudo detectado como inadequado pela IA (Sightengine/Perspective API).
              Voce pode aprovar manualmente se achar que foi um falso positivo.
            </>
          )}
          {filter === 'help_request' && (
            <>
              <strong>Pedidos de Ajuda:</strong> Posts classificados como pedidos de ajuda (financeira, medica, etc).
              Estes posts aparecem na aba Pedidos de Ajuda do feed.
            </>
          )}
          {filter === 'pending' && (
            <>
              <strong>Pendentes:</strong> Posts aguardando revisao manual.
              Foram sinalizados pela moderacao automatica mas nao foram bloqueados.
            </>
          )}
        </div>
      </Card>

      {/* Lista de Posts */}
      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {posts.map((post) => (
            <ModerationCard
              key={post.id}
              post={post}
              author={post.author as { id: string; full_name: string | null; avatar_url: string | null; email: string } | null}
              filter={filter}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">
            {filter === 'blocked' ? '✅' : filter === 'help_request' ? '📭' : '✅'}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {filter === 'blocked'
              ? 'Nenhum post bloqueado'
              : filter === 'help_request'
              ? 'Nenhum pedido de ajuda'
              : 'Nenhum post pendente'}
          </h2>
          <p className="text-gray-500">
            {filter === 'blocked'
              ? 'A moderacao automatica esta funcionando corretamente!'
              : filter === 'help_request'
              ? 'Nenhum post com pedido de ajuda no momento.'
              : 'Todos os posts foram revisados.'}
          </p>
        </Card>
      )}
    </div>
  );
}
