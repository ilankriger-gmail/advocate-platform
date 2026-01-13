'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de stories admin
const storiesAdminLogger = logger.withContext('[StoriesAdmin]');

/**
 * Deletar story (apenas admin)
 */
export async function deleteStoryAdmin(storyId: string): Promise<ActionResponse<boolean>> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    const supabase = await createClient();

    // Buscar story para log
    const { data: story } = await supabase
      .from('stories')
      .select('id, user_id, title')
      .eq('id', storyId)
      .single();

    if (!story) {
      return { error: 'Story não encontrado' };
    }

    storiesAdminLogger.info('Admin deletando story', {
      storyId,
      storyUserId: story.user_id,
      adminId: user.id,
    });

    // Deletar o story (views serão deletadas por CASCADE)
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      storiesAdminLogger.error('Erro ao deletar story', { error: sanitizeError(error) });
      return { error: 'Erro ao deletar story' };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/dashboard');
    revalidatePath('/admin/stories');

    storiesAdminLogger.info('Story deletado com sucesso pelo admin', {
      storyId,
      adminId: user.id,
    });

    return { data: true };
  } catch (err) {
    storiesAdminLogger.error('Erro ao deletar story', { error: sanitizeError(err) });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar todos os stories com métricas para admin
 */
export async function getAllStoriesForAdmin(): Promise<ActionResponse<{
  stories: Array<{
    id: string;
    user_id: string;
    title: string | null;
    caption: string | null;
    media_url: string[];
    media_type: string;
    youtube_url: string | null;
    instagram_url: string | null;
    linked_content_type: string | null;
    linked_content_id: string | null;
    created_at: string;
    author: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      instagram_username: string | null;
    } | null;
    view_count: number;
  }>;
  stats: {
    total: number;
    totalViews: number;
    uniqueCreators: number;
    avgViews: number;
  };
}>> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    const supabase = await createClient();

    // Buscar todos os stories
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

    if (error) {
      storiesAdminLogger.error('Erro ao buscar stories', { error: sanitizeError(error) });
      return { error: 'Erro ao carregar stories' };
    }

    // Buscar contagem de views
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
    const totalViews = Object.values(viewCounts).reduce((a, b) => a + b, 0);
    const uniqueCreators = new Set(stories?.map(s => s.user_id)).size;

    const formattedStories = (stories || []).map(story => ({
      id: story.id,
      user_id: story.user_id,
      title: story.title,
      caption: story.caption,
      media_url: story.media_url || [],
      media_type: story.media_type || 'image',
      youtube_url: story.youtube_url,
      instagram_url: story.instagram_url,
      linked_content_type: story.linked_content_type,
      linked_content_id: story.linked_content_id,
      created_at: story.created_at,
      author: story.author as {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        instagram_username: string | null;
      } | null,
      view_count: viewCounts[story.id] || 0,
    }));

    return {
      data: {
        stories: formattedStories,
        stats: {
          total: stories?.length || 0,
          totalViews,
          uniqueCreators,
          avgViews: stories?.length ? Math.round(totalViews / stories.length) : 0,
        },
      },
    };
  } catch (err) {
    storiesAdminLogger.error('Erro ao buscar stories', { error: sanitizeError(err) });
    return { error: 'Erro interno do servidor' };
  }
}
