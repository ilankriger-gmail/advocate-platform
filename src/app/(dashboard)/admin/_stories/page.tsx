import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { StoryAdminCard } from './StoryAdminCard';


export const dynamic = 'force-dynamic';
export default async function AdminStoriesPage() {
  const supabase = await createClient();

  // Buscar todos os stories com dados do autor e contagem de views
  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      *,
      author:users!stories_user_id_fkey (
        id,
        full_name,
        avatar_url,
        instagram_username
      )
    `)
    .order('created_at', { ascending: false });

  // Buscar contagem de views por story
  const storyIds = stories?.map(s => s.id) || [];
  let viewCounts: Record<string, number> = {};

  if (storyIds.length > 0) {
    const { data: viewsData } = await supabase
      .from('story_views')
      .select('story_id')
      .in('story_id', storyIds);

    if (viewsData) {
      viewCounts = viewsData.reduce((acc, view) => {
        acc[view.story_id] = (acc[view.story_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  // Calcular estatísticas
  const totalStories = stories?.length || 0;
  const totalViews = Object.values(viewCounts).reduce((a, b) => a + b, 0);
  const uniqueCreators = new Set(stories?.map(s => s.user_id)).size;

  // Agrupar por tipo de mídia
  const byMediaType = stories?.reduce((acc, s) => {
    const type = s.media_type || 'image';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
            <span className="text-3xl">📱</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Stories</h1>
            <p className="text-gray-500 text-sm mt-0.5">Visualize e modere stories dos criadores</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📱</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-700">{totalStories}</p>
              <p className="text-xs text-pink-600">Total Stories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👁️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalViews}</p>
              <p className="text-xs text-blue-600">Total Views</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👤</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{uniqueCreators}</p>
              <p className="text-xs text-green-600">Criadores</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">
                {totalStories > 0 ? Math.round(totalViews / totalStories) : 0}
              </p>
              <p className="text-xs text-purple-600">Média Views</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-gray-100 text-gray-700">
          Todos ({totalStories})
        </Badge>
        {Object.entries(byMediaType).map(([type, count]) => (
          <Badge key={type} className="bg-gray-50 text-gray-600">
            {type === 'image' && '🖼️ Imagem'}
            {type === 'carousel' && '🎠 Carrossel'}
            {type === 'youtube' && '▶️ YouTube'}
            {type === 'instagram' && '📷 Instagram'}
            {' '}({String(count)})
          </Badge>
        ))}
      </div>

      {/* Lista de Stories */}
      {stories && stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map((story) => (
            <StoryAdminCard
              key={story.id}
              story={{
                id: story.id,
                user_id: story.user_id,
                title: story.title,
                caption: story.caption,
                media_url: story.media_url || [],
                media_type: story.media_type,
                youtube_url: story.youtube_url,
                instagram_url: story.instagram_url,
                linked_content_type: story.linked_content_type,
                linked_content_id: story.linked_content_id,
                created_at: story.created_at,
              }}
              author={story.author as {
                id: string;
                full_name: string | null;
                avatar_url: string | null;
                instagram_username: string | null;
              } | null}
              viewCount={viewCounts[story.id] || 0}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum story encontrado</h2>
          <p className="text-gray-500">
            Os criadores ainda não publicaram nenhum story.
          </p>
        </Card>
      )}
    </div>
  );
}
