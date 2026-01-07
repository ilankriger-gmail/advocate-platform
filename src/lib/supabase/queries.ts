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
 */
export async function getCreatorPosts(limit = 5): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Primeiro buscar o criador
  const { data: creator } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, is_creator')
    .eq('is_creator', true)
    .single();

  if (!creator) return [];

  // Buscar posts do criador
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', creator.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  // Combinar posts com autor
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
 * Buscar posts da comunidade (fãs)
 */
export async function getCommunityPosts(limit = 20, offset = 0): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts de usuários que NÃO são criadores
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, users!inner(id, full_name, avatar_url, is_creator)')
    .eq('status', 'approved')
    .eq('users.is_creator', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // Fallback: buscar sem join se der erro de FK
    const { data: fallbackPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'approved')
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return (fallbackPosts || []).map(post => ({
      ...post,
      author: null,
    }));
  }

  return (posts || []).map((post: any) => ({
    ...post,
    author: post.users ? {
      id: post.users.id,
      full_name: post.users.full_name,
      avatar_url: post.users.avatar_url,
      is_creator: post.users.is_creator,
    } : null,
    users: undefined,
  }));
}

/**
 * Buscar todos os posts aprovados (feed geral)
 */
export async function getFeed(limit = 20, offset = 0): Promise<PostWithAuthor[]> {
  const supabase = await createClient();

  // Buscar posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

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

// ============ RECOMPENSAS (legado - use rewards.ts) ============

export interface RewardFilters {
  isActive?: boolean;
  category?: string;
  minPoints?: number;
  maxPoints?: number;
}

// Interface legada mantida para compatibilidade
interface LegacyRewardWithAvailability {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  category: string;
  is_active: boolean;
  created_at: string;
  claims_count: number;
  is_available: boolean;
}

/**
 * @deprecated Use getActiveRewards from rewards.ts
 */
export async function getRewards(filters?: RewardFilters): Promise<LegacyRewardWithAvailability[]> {
  const supabase = await createClient();

  let query = supabase
    .from('rewards')
    .select('*')
    .order('points_cost', { ascending: true });

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;

  if (error) return [];

  return (data || []).map((reward: any) => ({
    ...reward,
    claims_count: 0,
    is_available: reward.stock === null || reward.stock > 0,
  }));
}
