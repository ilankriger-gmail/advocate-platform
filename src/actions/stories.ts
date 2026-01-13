'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { Story, StoryWithAuthor, CreatorStories, CreateStoryData } from '@/types/story';
import { logger, sanitizeError } from '@/lib';

// Logger contextualizado para o módulo de stories
const storiesLogger = logger.withContext('[Stories]');

/**
 * Busca todos os stories agrupados por criador para exibir na barra
 * Stories de criadores com conteúdo não visto aparecem primeiro
 */
export async function getStoriesForBar(): Promise<ActionResponse<CreatorStories[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Buscar todos os stories com dados do autor
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:users!stories_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      storiesLogger.error('Erro ao buscar stories', { error: sanitizeError(error) });
      return { error: 'Erro ao carregar stories' };
    }

    if (!stories || stories.length === 0) {
      return { data: [] };
    }

    // Buscar visualizações do usuário atual (se autenticado)
    let viewedStoryIds: Set<string> = new Set();
    if (user) {
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id);

      if (views) {
        viewedStoryIds = new Set(views.map((v) => v.story_id));
      }
    }

    // Agrupar stories por criador
    const creatorsMap = new Map<string, CreatorStories>();

    for (const story of stories) {
      const author = story.author as { id: string; full_name: string | null; avatar_url: string | null } | null;
      if (!author) continue;

      const existing = creatorsMap.get(author.id);
      const storyData: Story = {
        id: story.id,
        user_id: story.user_id,
        title: story.title,
        content: story.content,
        media_url: story.media_url || [],
        media_type: story.media_type as Story['media_type'],
        youtube_url: story.youtube_url,
        instagram_url: story.instagram_url,
        caption: story.caption,
        position: story.position,
        created_at: story.created_at,
        updated_at: story.updated_at,
      };

      if (existing) {
        existing.stories.push(storyData);
        if (!viewedStoryIds.has(story.id)) {
          existing.hasUnviewed = true;
        }
        // Manter o mais recente
        if (new Date(story.created_at) > new Date(existing.lastStoryAt)) {
          existing.lastStoryAt = story.created_at;
        }
      } else {
        creatorsMap.set(author.id, {
          creator: {
            id: author.id,
            full_name: author.full_name,
            avatar_url: author.avatar_url,
          },
          stories: [storyData],
          hasUnviewed: !viewedStoryIds.has(story.id),
          lastStoryAt: story.created_at,
        });
      }
    }

    // Converter para array e ordenar
    // Criadores com stories não vistos primeiro, depois por data mais recente
    const creatorsWithStories = Array.from(creatorsMap.values())
      .sort((a, b) => {
        // Não vistos primeiro
        if (a.hasUnviewed && !b.hasUnviewed) return -1;
        if (!a.hasUnviewed && b.hasUnviewed) return 1;
        // Depois por data mais recente
        return new Date(b.lastStoryAt).getTime() - new Date(a.lastStoryAt).getTime();
      });

    // Ordenar stories de cada criador por created_at (mais antigo primeiro para visualização sequencial)
    for (const creator of creatorsWithStories) {
      creator.stories.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    return { data: creatorsWithStories };
  } catch (err) {
    storiesLogger.error('Erro ao buscar stories', { error: sanitizeError(err) });
    return { error: 'Erro ao carregar stories' };
  }
}

/**
 * Busca todos os stories de um criador específico
 */
export async function getCreatorStories(creatorId: string): Promise<ActionResponse<StoryWithAuthor[]>> {
  try {
    const supabase = await createClient();

    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        *,
        author:users!stories_user_id_fkey (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', creatorId)
      .order('created_at', { ascending: true });

    if (error) {
      storiesLogger.error('Erro ao buscar stories do criador', { error: sanitizeError(error) });
      return { error: 'Erro ao carregar stories' };
    }

    const typedStories: StoryWithAuthor[] = (stories || []).map((story) => ({
      id: story.id,
      user_id: story.user_id,
      title: story.title,
      content: story.content,
      media_url: story.media_url || [],
      media_type: story.media_type as Story['media_type'],
      youtube_url: story.youtube_url,
      instagram_url: story.instagram_url,
      caption: story.caption,
      position: story.position,
      created_at: story.created_at,
      updated_at: story.updated_at,
      author: story.author as { id: string; full_name: string | null; avatar_url: string | null } | null,
    }));

    return { data: typedStories };
  } catch (err) {
    storiesLogger.error('Erro ao buscar stories do criador', { error: sanitizeError(err) });
    return { error: 'Erro ao carregar stories' };
  }
}

/**
 * Criar novo story (apenas criadores/admin)
 */
export async function createStory(data: CreateStoryData): Promise<ActionResponse<Story>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se é criador ou admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_creator, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return { error: 'Erro ao verificar permissões' };
    }

    if (!userData.is_creator && userData.role !== 'admin') {
      return { error: 'Apenas criadores e administradores podem criar stories' };
    }

    // Validar dados - deve ter imagens OU youtube OU instagram
    const hasImages = data.media_url && data.media_url.length > 0;
    const hasYoutube = data.youtube_url && data.youtube_url.trim() !== '';
    const hasInstagram = data.instagram_url && data.instagram_url.trim() !== '';

    if (!hasImages && !hasYoutube && !hasInstagram) {
      return { error: 'É necessário adicionar pelo menos uma mídia (imagem, YouTube ou Instagram)' };
    }

    // Determinar tipo de mídia
    let mediaType = data.media_type;
    if (hasYoutube) {
      mediaType = 'youtube';
    } else if (hasInstagram) {
      mediaType = 'instagram';
    } else if (hasImages && data.media_url!.length > 1) {
      mediaType = 'carousel';
    } else {
      mediaType = 'image';
    }

    // Buscar a maior position atual do usuário
    const { data: lastStory } = await supabase
      .from('stories')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    const nextPosition = (lastStory?.position ?? -1) + 1;

    // Criar o story
    const { data: story, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        title: data.title || null,
        content: data.content || null,
        media_url: hasImages ? data.media_url : [],
        media_type: mediaType,
        youtube_url: hasYoutube ? data.youtube_url : null,
        instagram_url: hasInstagram ? data.instagram_url : null,
        caption: data.caption || null,
        position: nextPosition,
      })
      .select()
      .single();

    if (error) {
      storiesLogger.error('Erro ao criar story', { error: sanitizeError(error) });
      return { error: 'Erro ao criar story' };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/dashboard');

    storiesLogger.info('Story criado com sucesso', { storyId: story.id, userId: user.id });

    return {
      data: {
        ...story,
        media_url: story.media_url || [],
        media_type: story.media_type as Story['media_type'],
      },
    };
  } catch (err) {
    storiesLogger.error('Erro ao criar story', { error: sanitizeError(err) });
    return { error: 'Erro ao criar story' };
  }
}

/**
 * Marcar story como visualizado
 */
export async function markStoryAsViewed(storyId: string): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Não retornar erro, apenas não registrar view para visitantes
      return { data: true };
    }

    // Upsert para evitar duplicatas
    const { error } = await supabase
      .from('story_views')
      .upsert(
        {
          story_id: storyId,
          user_id: user.id,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict: 'story_id,user_id',
        }
      );

    if (error) {
      // Ignorar erros de constraint (já visualizado)
      if (error.code !== '23505') {
        storiesLogger.error('Erro ao marcar story como visto', { error: sanitizeError(error) });
      }
    }

    return { data: true };
  } catch (err) {
    storiesLogger.error('Erro ao marcar story como visto', { error: sanitizeError(err) });
    return { data: true }; // Não falhar a visualização por erro de registro
  }
}

/**
 * Deletar story (apenas autor ou admin)
 */
export async function deleteStory(storyId: string): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se é o autor ou admin
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('user_id')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      return { error: 'Story não encontrado' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAuthor = story.user_id === user.id;
    const isAdmin = userData?.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return { error: 'Sem permissão para deletar este story' };
    }

    // Deletar o story (views serão deletadas por CASCADE)
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      storiesLogger.error('Erro ao deletar story', { error: sanitizeError(error) });
      return { error: 'Erro ao deletar story' };
    }

    // Revalidar cache
    revalidatePath('/');
    revalidatePath('/dashboard');

    storiesLogger.info('Story deletado com sucesso', { storyId, userId: user.id });

    return { data: true };
  } catch (err) {
    storiesLogger.error('Erro ao deletar story', { error: sanitizeError(err) });
    return { error: 'Erro ao deletar story' };
  }
}

/**
 * Verificar se usuário pode criar stories
 */
export async function canCreateStory(): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: false };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('is_creator, role')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return { data: false };
    }

    return { data: userData.is_creator || userData.role === 'admin' };
  } catch {
    return { data: false };
  }
}
