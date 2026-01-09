'use server';

import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor } from '@/types/post';

export type FeedSortType = 'new' | 'top' | 'hot';
export type FeedType = 'creator' | 'community' | 'all';

/**
 * Cursor composto para ordenação 'top'
 * Codifica likes_count e id para paginação determinística
 */
interface TopCursor {
  likes_count: number;
  id: string;
}

/**
 * Codifica um cursor composto em string base64
 */
function encodeTopCursor(cursor: TopCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Decodifica um cursor composto de string base64
 * Retorna null se o cursor for inválido
 */
function decodeTopCursor(cursor: string): TopCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.likes_count === 'number' && typeof parsed.id === 'string') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

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

  // Aplicar ordenação e paginação por cursor
  switch (sort) {
    case 'top': {
      // Ordenação estável: likes_count DESC, id DESC
      query = query
        .order('likes_count', { ascending: false })
        .order('id', { ascending: false });

      // Aplicar cursor composto se fornecido
      if (cursor) {
        const decodedCursor = decodeTopCursor(cursor);
        if (decodedCursor) {
          // WHERE (likes_count < cursor_likes) OR (likes_count = cursor_likes AND id < cursor_id)
          query = query.or(
            `likes_count.lt.${decodedCursor.likes_count},and(likes_count.eq.${decodedCursor.likes_count},id.lt.${decodedCursor.id})`
          );
        }
      }
      break;
    }
    case 'hot':
      // Hot usa hot_score (calculado no client) com decay temporal
      // Cursor baseado em created_at para garantir paginação estável
      // Buscar posts ordenados por created_at e reordenar por hot_score no client
      query = query.order('created_at', { ascending: false });

      // Cursor baseado em created_at (similar ao 'new')
      if (cursor) {
        query = query.lt('created_at', cursor);
      }
      break;
    case 'new':
    default:
      query = query.order('created_at', { ascending: false });

      // Cursor baseado em created_at
      if (cursor) {
        query = query.lt('created_at', cursor);
      }
  }

  // Limitar resultados
  query = query.limit(limit);

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
    const lastPost = posts[posts.length - 1];

    switch (sort) {
      case 'new':
        nextCursor = lastPost.created_at;
        break;
      case 'top':
        // Cursor composto com likes_count e id
        nextCursor = encodeTopCursor({
          likes_count: lastPost.likes_count,
          id: lastPost.id,
        });
        break;
      case 'hot':
        // Cursor baseado em created_at (após reordenação por hot_score)
        nextCursor = lastPost.created_at;
        break;
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
