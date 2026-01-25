import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { CommentAdminCard } from './CommentAdminCard';


export const dynamic = 'force-dynamic';
export default async function AdminComentariosPage() {
  const supabase = await createClient();

  // Buscar comentários com dados do autor e post
  const { data: comments } = await supabase
    .from('post_comments')
    .select(`
      *,
      author:users!post_comments_user_id_fkey (
        id,
        full_name,
        avatar_url,
        instagram_username
      ),
      post:posts!post_comments_post_id_fkey (
        id,
        content,
        media_url
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(100);

  // Buscar estatísticas
  const [
    { count: totalComments },
    { count: deletedComments },
  ] = await Promise.all([
    supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
    supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('is_deleted', true),
  ]);

  // Agrupar por dia para ver tendência
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const commentsToday = comments?.filter(c =>
    c.created_at.startsWith(todayStr)
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-3xl">💬</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderar Comentários</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gerencie comentários dos usuários</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">💬</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalComments || 0}</p>
              <p className="text-xs text-blue-600">Total Ativos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{commentsToday}</p>
              <p className="text-xs text-green-600">Hoje</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🗑️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{deletedComments || 0}</p>
              <p className="text-xs text-red-600">Excluídos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {comments?.length || 0}
              </p>
              <p className="text-xs text-purple-600">Últimos 100</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Comentários */}
      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentAdminCard
              key={comment.id}
              comment={{
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                is_deleted: comment.is_deleted,
              }}
              author={comment.author as {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
                instagram_username: string | null;
              } | null}
              post={comment.post as {
                id: string;
                content: string | null;
                media_url: string[] | null;
              } | null}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum comentário encontrado</h2>
          <p className="text-gray-500">
            Os usuários ainda não fizeram nenhum comentário.
          </p>
        </Card>
      )}
    </div>
  );
}
