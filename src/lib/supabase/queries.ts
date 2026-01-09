/**
 * Queries para a Plataforma de Comunidade de Criador
 */

import { createClient } from './server';
import type { PostWithAuthor, CreatorProfile, User } from './types';

// ============ CRIADOR ============

/**
 * Buscar perfil do criador da comunidade
 */
export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  const supabase = await createClient();

  // Buscar usuário criador
  const { data: creator, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_creator', true)
    .single();

  if (error || !creator) return null;

  // Buscar estatísticas
  const [postsResult, fansResult] = await Promise.all([
    supabase
      .from('posts')
      .select('id, likes_count')
      .eq('user_id', creator.id)
      .eq('status', 'approved'),
    supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('is_creator', false),
  ]);

  const posts = postsResult.data || [];
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  return {
    ...creator,
    posts_count: posts.length,
    fans_count: fansResult.count || 0,
    total_likes: totalLikes,
  };
}

/**
 * Buscar posts do criador (para o feed do criador)
 * Filtra por type='creator' para mostrar posts do criador
 *
 * @deprecated Use getFeedPosts() de src/actions/feed.ts com type='creator' e cursor-based pagination
 */
export async function getCreatorPosts(limit = 5): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts do tipo 'creator' com JOIN
  const { data: posts, error } = await supabase
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
    .eq('type', 'creator')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

/**
 * Buscar posts em destaque do criador
 */
export async function getFeaturedCreatorPosts(limit = 3): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts em destaque com JOIN - usa inner join para filtrar por is_creator
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!inner(
        id,
        full_name,
        avatar_url,
        is_creator
      )
    `)
    .eq('status', 'approved')
    .eq('is_featured', true)
    .eq('author.is_creator', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

// ============ COMUNIDADE ============

/**
 * Buscar posts da comunidade
 * Filtra por type='community' para mostrar posts da comunidade
 *
 * @deprecated Use getFeedPosts() de src/actions/feed.ts com type='community' e cursor-based pagination
 */
export async function getCommunityPosts(limit = 20, offset = 0): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts do tipo 'community' com JOIN
  const { data: posts, error } = await supabase
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
    .eq('status', 'approved')
    .eq('type', 'community')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

/**
 * Buscar todos os posts aprovados (feed geral)
 *
 * @deprecated Use getFeedPosts() de src/actions/feed.ts com type='all' e cursor-based pagination
 */
export async function getFeed(limit = 20, offset = 0): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts com JOIN
  const { data: posts, error } = await supabase
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
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

// ============ POSTS ============

export interface PostFilters {
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'creator' | 'community';
  userId?: string;
}

/**
 * Buscar posts com filtros
 */
export async function getPosts(filters?: PostFilters): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

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
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  const { data: posts, error } = await query;

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

/**
 * Buscar post por ID
 */
export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
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
    .eq('id', id)
    .single();

  if (error || !post) return null;

  return post as PostWithAuthor;
}

// ============ PERFIL ============

export interface UserStats {
  total_posts: number;
  approved_posts: number;
  total_likes: number;
}

/**
 * Buscar estatísticas do usuário
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, status, likes_count')
    .eq('user_id', userId);

  const allPosts = posts || [];
  const approvedPosts = allPosts.filter(p => p.status === 'approved');
  const totalLikes = approvedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  return {
    total_posts: allPosts.length,
    approved_posts: approvedPosts.length,
    total_likes: totalLikes,
  };
}

/**
 * Buscar perfil do usuário
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;

  return data;
}

/**
 * Buscar posts do usuário
 */
export async function getUserPosts(userId: string, limit = 10): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts do usuário com JOIN
  const { data: posts, error } = await supabase
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
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !posts || posts.length === 0) return [];

  return posts as PostWithAuthor[];
}

// Seção de recompensas removida - use src/lib/supabase/rewards.ts
