'use server';

import { createClient } from '@/lib/supabase/server';
import { logger, sanitizeError } from '@/lib';
import type { PostWithAuthor } from '@/types/post';

const searchLogger = logger.withContext('[Search]');

export type SearchType = 'all' | 'posts' | 'challenges' | 'rewards' | 'events' | 'users';

/**
 * Resultado de busca tipado
 */
export interface SearchResults {
  posts: PostWithAuthor[];
  challenges: ChallengeResult[];
  rewards: RewardResult[];
  events: EventResult[];
  users: UserResult[];
}

export interface ChallengeResult {
  id: string;
  title: string;
  description: string | null;
  type: string;
  icon: string | null;
  thumbnail_url: string | null;
  coins_reward: number;
  ends_at: string | null;
  status: string;
}

export interface RewardResult {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  coins_required: number;
  quantity_available: number;
}

export interface EventResult {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
  event_date: string;
  status: string;
}

export interface UserResult {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
}

/**
 * Busca geral em múltiplas tabelas
 */
export async function searchAll(
  query: string,
  type: SearchType = 'all',
  limit = 10
): Promise<SearchResults> {
  const supabase = await createClient();
  const searchQuery = `%${query.toLowerCase()}%`;

  const results: SearchResults = {
    posts: [],
    challenges: [],
    rewards: [],
    events: [],
    users: [],
  };

  try {
    // Busca paralela em múltiplas tabelas
    const searches: Promise<void>[] = [];

    // Posts
    if (type === 'all' || type === 'posts') {
      searches.push(
        (async () => {
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              author:users!posts_user_id_fkey(
                id,
                full_name,
                avatar_url,
                is_creator,
                member_number
              )
            `)
            .eq('status', 'approved')
            .or(`title.ilike.${searchQuery},content.ilike.${searchQuery}`)
            .order('created_at', { ascending: false })
            .limit(limit);
          results.posts = (data || []) as PostWithAuthor[];
        })()
      );
    }

    // Desafios
    if (type === 'all' || type === 'challenges') {
      searches.push(
        (async () => {
          const { data } = await supabase
            .from('challenges')
            .select('id, title, description, type, icon, thumbnail_url, coins_reward, ends_at, status')
            .eq('is_active', true)
            .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
            .order('created_at', { ascending: false })
            .limit(limit);
          results.challenges = data || [];
        })()
      );
    }

    // Prêmios
    if (type === 'all' || type === 'rewards') {
      searches.push(
        (async () => {
          const { data } = await supabase
            .from('rewards')
            .select('id, name, description, image_url, coins_required, quantity_available')
            .eq('is_active', true)
            .gt('quantity_available', 0)
            .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
            .order('created_at', { ascending: false })
            .limit(limit);
          results.rewards = data || [];
        })()
      );
    }

    // Eventos
    if (type === 'all' || type === 'events') {
      searches.push(
        (async () => {
          const { data } = await supabase
            .from('events')
            .select('id, title, description, image_url, location, event_date, status')
            .eq('status', 'published')
            .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
            .order('event_date', { ascending: true })
            .limit(limit);
          results.events = data || [];
        })()
      );
    }

    // Usuários
    if (type === 'all' || type === 'users') {
      searches.push(
        (async () => {
          const { data } = await supabase
            .from('users')
            .select('id, full_name, avatar_url, bio, is_creator')
            .ilike('full_name', searchQuery)
            .order('full_name', { ascending: true })
            .limit(limit);
          results.users = data || [];
        })()
      );
    }

    await Promise.all(searches);
    return results;
  } catch (error) {
    searchLogger.error('Erro na busca', { error: sanitizeError(error) });
    return results;
  }
}

/**
 * Busca dados para a página de descoberta (sem query de busca)
 * Retorna conteúdo em destaque
 */
export async function getDiscoverContent() {
  const supabase = await createClient();

  try {
    // Busca paralela de conteúdo em destaque
    const [
      trendingPostsResult,
      activeChallengesResult,
      availableRewardsResult,
      upcomingEventsResult,
      topUsersResult,
    ] = await Promise.all([
      // Posts em alta (mais curtidos dos últimos 7 dias)
      supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(
            id,
            full_name,
            avatar_url,
            is_creator,
                member_number
          )
        `)
        .eq('status', 'approved')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('likes_count', { ascending: false })
        .limit(6),

      // Desafios ativos
      supabase
        .from('challenges')
        .select('id, title, description, type, icon, thumbnail_url, coins_reward, ends_at, status')
        .eq('is_active', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4),

      // Prêmios disponíveis
      supabase
        .from('rewards')
        .select('id, name, description, image_url, coins_required, quantity_available')
        .eq('is_active', true)
        .gt('quantity_available', 0)
        .order('coins_required', { ascending: true })
        .limit(6),

      // Eventos próximos
      supabase
        .from('events')
        .select('id, title, description, image_url, location, event_date, status')
        .eq('status', 'published')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(4),

      // Top usuários do ranking
      supabase
        .from('user_coins')
        .select(`
          balance,
          user:users!user_coins_user_id_fkey(
            id,
            full_name,
            avatar_url,
            is_creator,
                member_number
          )
        `)
        .order('balance', { ascending: false })
        .limit(5),
    ]);

    return {
      trendingPosts: (trendingPostsResult.data || []) as PostWithAuthor[],
      activeChallenges: activeChallengesResult.data || [],
      availableRewards: availableRewardsResult.data || [],
      upcomingEvents: upcomingEventsResult.data || [],
      topUsers: topUsersResult.data || [],
    };
  } catch (error) {
    searchLogger.error('Erro ao buscar conteúdo de descoberta', { error: sanitizeError(error) });
    return {
      trendingPosts: [],
      activeChallenges: [],
      availableRewards: [],
      upcomingEvents: [],
      topUsers: [],
    };
  }
}
