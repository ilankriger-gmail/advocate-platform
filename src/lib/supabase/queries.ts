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

  const { data: creator } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, is_creator')
    .eq('is_creator', true)
    .single();

  if (!creator) return [];

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', creator.id)
    .eq('status', 'approved')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return (posts || []).map(post => ({
    ...post,
    author: {
      id: creator.id,
      full_name: creator.full_name,
      avatar_url: creator.avatar_url,
      is_creator: true,
    },
  }));
}

// ============ COMUNIDADE ============

/**
 * Buscar posts da comunidade
 * Filtra por type='community' para mostrar posts da comunidade
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
    .select('*')
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

  if (error) return [];

  if (!posts || posts.length === 0) return [];

  // Buscar autores separadamente
  const userIds = Array.from(new Set(posts.map(p => p.user_id)));
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, is_creator')
    .in('id', userIds);

  const usersMap = new Map((users || []).map(u => [u.id, u]));

  return posts.map(post => ({
    ...post,
    author: usersMap.get(post.user_id) || null,
  }));
}

/**
 * Buscar post por ID
 */
export async function getPostById(id: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) return null;

  // Buscar autor
  const { data: author } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, is_creator')
    .eq('id', post.user_id)
    .single();

  return {
    ...post,
    author: author || null,
  };
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

  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, is_creator')
    .eq('id', userId)
    .single();

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (posts || []).map(post => ({
    ...post,
    author: user || null,
  }));
}

// Seção de recompensas removida - use src/lib/supabase/rewards.ts
