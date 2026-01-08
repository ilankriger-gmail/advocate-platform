'use server';

import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor } from '@/types/post';

export type FeedSortType = 'new' | 'top' | 'hot';
export type FeedType = 'creator' | 'community' | 'all';

/**
 * Calcula hot score usando algoritmo Reddit-like
 * Posts com mais votos E mais recentes aparecem primeiro
 * O score decai exponencialmente com o tempo
 */
function calculateHotScore(voteScore: number, createdAt: string): number {
  const ageInHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  const gravity = 1.8; // Fator de decay temporal
  return voteScore / Math.pow(ageInHours + 2, gravity);
}

interface GetFeedParams {
  type: FeedType;
  sort?: FeedSortType;
  cursor?: string;
  limit?: number;
}

interface FeedResponse {
  posts: PostWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Busca posts do feed com paginação por cursor
 * Suporta diferentes tipos (criador/comunidade) e ordenações (novo/top/hot)
 */
export async function getFeedPosts({
  type,
  sort = 'new',
  cursor,
  limit = 10,
}: GetFeedParams): Promise<FeedResponse> {
  const supabase = await createClient();

  // Construir query base
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_user_id_fkey(
        id,
        full_name,
        avatar_url,
        is_creator
      )
    `)
    .eq('status', 'approved');

  // Filtrar por tipo
  if (type !== 'all') {
    query = query.eq('type', type);
  }

  // Aplicar ordenação
  switch (sort) {
    case 'top':
      query = query.order('likes_count', { ascending: false });
      break;
    case 'hot':
      // Hot usa likes_count com decay temporal
      // Por ora, usa likes_count + created_at como fallback
      query = query
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: false });
      break;
    case 'new':
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Paginação por cursor (usando created_at para new, vote_score+id para top)
  if (cursor) {
    if (sort === 'new') {
      query = query.lt('created_at', cursor);
    } else {
      // Para top/hot, usamos offset simples por enquanto
      // Cursor-based pagination com vote_score é mais complexo
      const offset = parseInt(cursor, 10) || 0;
      query = query.range(offset, offset + limit - 1);
    }
  }

  // Limitar resultados
  if (sort === 'new' || !cursor) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar feed:', error);
    return { posts: [], nextCursor: null, hasMore: false };
  }

  let posts = (data || []) as PostWithAuthor[];

  // Para ordenação 'hot', calcular score e reordenar no client
  if (sort === 'hot' && posts.length > 0) {
    posts = posts
      .map((post) => ({
        ...post,
        _hotScore: calculateHotScore(post.likes_count || 0, post.created_at),
      }))
      .sort((a, b) => (b._hotScore || 0) - (a._hotScore || 0))
      .map(({ _hotScore, ...post }) => post as PostWithAuthor);
  }

  const hasMore = posts.length === limit;

  // Calcular próximo cursor
  let nextCursor: string | null = null;
  if (hasMore && posts.length > 0) {
    if (sort === 'new') {
      nextCursor = posts[posts.length - 1].created_at;
    } else {
      // Para top/hot, usar offset
      const currentOffset = cursor ? parseInt(cursor, 10) : 0;
      nextCursor = String(currentOffset + limit);
    }
  }

  return { posts, nextCursor, hasMore };
}

/**
 * Busca posts iniciais para SSR
 * Usado na página inicial para carregar dados no servidor
 */
export async function getInitialFeedPosts(
  type: FeedType,
  limit = 10
): Promise<PostWithAuthor[]> {
  const result = await getFeedPosts({ type, limit });
  return result.posts;
}
