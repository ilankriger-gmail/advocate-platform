/**
 * Tipos relacionados a Posts
 */

import { Database } from '@/lib/supabase/types';

// Tipos base do banco
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostInsert = Database['public']['Tables']['posts']['Insert'];
export type PostUpdate = Database['public']['Tables']['posts']['Update'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];

// Status de post
export type PostStatus = 'pending' | 'approved' | 'rejected';
export type PostType = 'creator' | 'community';

// Tipo de mídia do post
export type MediaType = 'none' | 'image' | 'carousel' | 'youtube' | 'instagram';

// Post com dados do autor
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_creator: boolean;
    member_number?: number | null;
  } | null;
}

// Post completo com autor e interacoes do usuário
export interface PostWithDetails extends PostWithAuthor {
  is_liked?: boolean;
  comments?: CommentWithAuthor[];
}

// Comentario com dados do autor
export interface CommentWithAuthor extends PostComment {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Filtros para listagem de posts
export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  userId?: string;
}

// Dados para criar post via formulario
export interface CreatePostData {
  title?: string;            // Opcional para posts com YouTube/Instagram
  content?: string;
  type: PostType;
  media_type?: MediaType;
  media_url?: string[];      // Array para suportar carrossel
  youtube_url?: string;      // Apenas para criadores
  instagram_url?: string;    // Apenas para criadores
}

// Dados para atualizar post
export interface UpdatePostData {
  id: string;
  title?: string;
  content?: string;
  media_type?: MediaType;
  media_url?: string[];
  youtube_url?: string;
  instagram_url?: string;
}

// Dados para rejeicao de post
export interface RejectPostData {
  postId: string;
  reason: string;
}

/**
 * Resposta paginada genérica com cursor-based pagination
 *
 * @template T - Tipo dos itens retornados na página
 *
 * @property {T[]} data - Array de itens da página atual
 * @property {string | null} nextCursor - Cursor para a próxima página (null se não houver mais páginas)
 * @property {boolean} hasMore - Indica se existem mais páginas disponíveis
 * @property {number} [totalEstimate] - Estimativa total de itens (opcional, útil para UI de progresso)
 *
 * @example
 * ```typescript
 * const response: PaginatedFeedResponse<PostWithAuthor> = {
 *   data: [post1, post2, post3],
 *   nextCursor: 'eyJpZCI6IjEyMyIsImxpa2VzIjo0NX0=',
 *   hasMore: true,
 *   totalEstimate: 150
 * };
 * ```
 */
export interface PaginatedFeedResponse<T = unknown> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate?: number;
}
