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

// Post com dados do autor
export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_creator: boolean;
  } | null;
}

// Post completo com autor e interacoes do usuario
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
  title: string;
  content?: string;
  media_url?: string;
  type: PostType;
}

// Dados para rejeicao de post
export interface RejectPostData {
  postId: string;
  reason: string;
}
