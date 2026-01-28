'use server';

import { createClient } from '@/lib/supabase/server';
import type { PostWithAuthor, PaginatedFeedResponse } from '@/types/post';
import { logger, sanitizeError } from '@/lib';
import { filterSimilarPosts } from '@/lib/similarity';

// Logger contextualizado para o módulo de feed
const feedLogger = logger.withContext('[Feed]');

export type FeedSortType = 'new' | 'top' | 'hot' | 'comments';
export type FeedType = 'creator' | 'community' | 'all' | 'help_request' | 'following';

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
 * Cursor composto para ordenação 'comments'
 * Codifica comments_count e id para paginação determinística
 */
interface CommentsCursor {
  comments_count: number;
  id: string;
}

/**
 * Codifica um cursor de comments em string base64
 */
function encodeCommentsCursor(cursor: CommentsCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

/**
 * Decodifica um cursor de comments de string base64
 * Retorna null se o cursor for inválido
 */
function decodeCommentsCursor(cursor: string): CommentsCursor | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);
    if (typeof parsed.comments_count === 'number' && typeof parsed.id === 'string') {
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

/**
 * Parâmetros para buscar posts do feed
 */
interface GetFeedParams {
  /** Tipo de feed: 'creator' (posts do criador), 'community' (posts da comunidade) ou 'all' (todos) */
  type: FeedType;
  /** Ordenação: 'new' (mais recentes), 'top' (mais curtidos) ou 'hot' (trending com decay temporal) */
  sort?: FeedSortType;
  /** Cursor para paginação - string opaca retornada pela requisição anterior */
  cursor?: string;
  /** Número de posts por página (padrão: 10) */
  limit?: number;
}

/**
 * Busca posts do feed com paginação por cursor
 *
 * @description
 * Implementa cursor-based pagination eficiente para feeds com grande volume de dados.
 * Suporta três tipos de ordenação:
 * - 'new': Posts ordenados por data de criação (mais recentes primeiro)
 * - 'top': Posts ordenados por número de curtidas (cursor composto: likes_count + id)
 * - 'hot': Posts com trending score (combina curtidas e tempo decorrido - algoritmo Reddit-like)
 *
 * A paginação é determinística e previne duplicação de posts entre páginas.
 * Apenas posts com status 'approved' são retornados.
 *
 * @param {GetFeedParams} params - Parâmetros da busca
 * @returns {Promise<PaginatedFeedResponse<PostWithAuthor>>} Posts paginados com cursor para próxima página
 *
 * @example
 * // Primeira página - posts do criador ordenados por mais recentes
 * const firstPage = await getFeedPosts({
 *   type: 'creator',
 *   sort: 'new',
 *   limit: 10
 * });
 * console.log(firstPage.data); // Array com 10 posts
 * console.log(firstPage.hasMore); // true se existem mais posts
 *
 * // Segunda página - usar o cursor retornado
 * if (firstPage.hasMore && firstPage.nextCursor) {
 *   const secondPage = await getFeedPosts({
 *     type: 'creator',
 *     sort: 'new',
 *     cursor: firstPage.nextCursor,
 *     limit: 10
 *   });
 *   console.log(secondPage.data); // Próximos 10 posts
 * }
 *
 * @example
 * // Posts ordenados por curtidas (top)
 * const topPosts = await getFeedPosts({
 *   type: 'all',
 *   sort: 'top',
 *   limit: 20
 * });
 * // Cursor é composto: codifica likes_count e id para ordenação estável
 *
 * @example
 * // Posts trending (hot) - combina curtidas e recência
 * const hotPosts = await getFeedPosts({
 *   type: 'community',
 *   sort: 'hot',
 *   limit: 15
 * });
 * // Hot score calculado no client: voteScore / (ageInHours + 2)^1.8
 */
export async function getFeedPosts({
  type,
  sort = 'new',
  cursor,
  limit = 10,
}: GetFeedParams): Promise<PaginatedFeedResponse<PostWithAuthor>> {
  const supabase = await createClient();

  // Construir query base — inclui preview dos 2 últimos comentários (evita N+1)
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_user_id_fkey(
        id,
        full_name,
        avatar_url,
        is_creator,
        member_number
      ),
      comment_previews:post_comments(
        id,
        content,
        created_at,
        parent_id,
        author:users!post_comments_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('status', 'approved');

  // Filtrar por tipo ou categoria
  if (type === 'following') {
    // Feed de usuários que o usuário atual segue
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    // Buscar IDs de quem o usuário segue
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = following?.map((f) => f.following_id) || [];

    if (followingIds.length === 0) {
      return { data: [], nextCursor: null, hasMore: false };
    }

    // Feed de seguindo - EXCLUIR pedidos de ajuda
    query = query
      .in('user_id', followingIds)
      .or('content_category.is.null,content_category.neq.help_request');
  } else if (type === 'help_request') {
    // Pedidos de ajuda - filtrar por content_category
    query = query.eq('content_category', 'help_request');
  } else if (type === 'community') {
    // Feed da comunidade - mostra todos os posts (creator + community), exceto pedidos de ajuda
    // Isso garante que posts do criador (onboarding, etc) apareçam na aba comunidade
    query = query.or('content_category.is.null,content_category.neq.help_request');
  } else if (type !== 'all') {
    // Feed creator - só posts do criador
    query = query
      .eq('type', type)
      .or('content_category.is.null,content_category.neq.help_request');
  } else {
    // Feed 'all' - também excluir pedidos de ajuda (só aparecem na aba dedicada)
    query = query.or('content_category.is.null,content_category.neq.help_request');
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
    case 'comments': {
      // Ordenação estável: comments_count DESC, id DESC
      query = query
        .order('comments_count', { ascending: false })
        .order('id', { ascending: false });

      // Aplicar cursor composto se fornecido
      if (cursor) {
        const decodedCursor = decodeCommentsCursor(cursor);
        if (decodedCursor) {
          // WHERE (comments_count < cursor_count) OR (comments_count = cursor_count AND id < cursor_id)
          query = query.or(
            `comments_count.lt.${decodedCursor.comments_count},and(comments_count.eq.${decodedCursor.comments_count},id.lt.${decodedCursor.id})`
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
    feedLogger.error('Erro ao buscar feed', { error: sanitizeError(error) });
    return { data: [], nextCursor: null, hasMore: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let posts = (data || []).map((post: any) => {
    // Process comment_previews: keep only last 2 top-level comments
    const previews = (post.comment_previews || [])
      .filter((c: { parent_id?: string | null }) => !c.parent_id)
      .slice(-2);
    return { ...post, comment_previews: previews };
  }) as PostWithAuthor[];

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

  // Filtrar posts duplicados do MESMO usuário (texto similar ou mesma imagem)
  // Só remove no feed, no perfil da pessoa mostra todos
  const originalLength = posts.length;
  posts = filterSimilarPosts(posts, 0.5);
  
  if (posts.length < originalLength) {
    feedLogger.debug('Posts similares filtrados', { 
      original: originalLength, 
      filtered: posts.length,
      removed: originalLength - posts.length 
    });
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
      case 'comments':
        // Cursor composto com comments_count e id
        nextCursor = encodeCommentsCursor({
          comments_count: lastPost.comments_count,
          id: lastPost.id,
        });
        break;
      case 'hot':
        // Cursor baseado em created_at (após reordenação por hot_score)
        nextCursor = lastPost.created_at;
        break;
    }
  }

  return { data: posts, nextCursor, hasMore };
}

/**
 * Busca posts iniciais para SSR (Server-Side Rendering)
 *
 * @description
 * Função auxiliar para carregar a primeira página de posts no servidor.
 * Ideal para uso em Server Components do Next.js para melhorar o First Contentful Paint (FCP).
 * Retorna apenas o array de posts, descartando metadados de paginação.
 *
 * @param {FeedType} type - Tipo de feed: 'creator', 'community' ou 'all'
 * @param {number} [limit=10] - Número de posts a carregar (padrão: 10)
 * @returns {Promise<PostWithAuthor[]>} Array de posts com dados do autor
 *
 * @example
 * // Em um Server Component (Next.js App Router)
 * export default async function HomePage() {
 *   const initialPosts = await getInitialFeedPosts('all', 10);
 *
 *   return (
 *     <InfiniteFeed
 *       type="all"
 *       sort="new"
 *       initialPosts={initialPosts} // SSR - zero loading state
 *     />
 *   );
 * }
 *
 * @example
 * // Feed de posts do criador
 * const creatorPosts = await getInitialFeedPosts('creator', 15);
 */
export async function getInitialFeedPosts(
  type: FeedType,
  limit = 10
): Promise<PostWithAuthor[]> {
  const result = await getFeedPosts({ type, limit });
  return result.data;
}
