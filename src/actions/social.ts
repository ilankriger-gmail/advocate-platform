'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { notifyNewFollower } from '@/actions/notifications';
import type {
  UserWithFollowStatus,
  PaginatedUsersResponse,
  PublicProfile,
  ProfileStats,
  SuggestedUser,
} from '@/types/social';

const PAGE_SIZE = 20;

/**
 * Seguir um usuário
 */
export async function followUser(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  if (user.id === userId) {
    return { success: false, error: 'Você não pode seguir a si mesmo' };
  }

  const { error } = await supabase
    .from('user_follows')
    .insert({
      follower_id: user.id,
      following_id: userId,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Você já segue este usuário' };
    }
    console.error('Erro ao seguir usuário:', error);
    return { success: false, error: 'Erro ao seguir usuário' };
  }

  // Enviar notificação para o usuário seguido
  try {
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    if (followerProfile) {
      await notifyNewFollower(
        userId,
        followerProfile.full_name || 'Alguém',
        followerProfile.avatar_url || undefined
      );
    }
  } catch (notifyError) {
    // Não falhar a operação se a notificação falhar
    console.error('Erro ao enviar notificação de follow:', notifyError);
  }

  revalidatePath(`/profile/${userId}`);
  revalidatePath('/perfil');

  return { success: true, error: null };
}

/**
 * Deixar de seguir um usuário
 */
export async function unfollowUser(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId);

  if (error) {
    console.error('Erro ao deixar de seguir:', error);
    return { success: false, error: 'Erro ao deixar de seguir' };
  }

  revalidatePath(`/profile/${userId}`);
  revalidatePath('/perfil');

  return { success: true, error: null };
}

/**
 * Toggle follow/unfollow
 */
export async function toggleFollow(userId: string): Promise<{
  success: boolean;
  isFollowing: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, isFollowing: false, error: 'Usuário não autenticado' };
  }

  // Verificar se já está seguindo
  const { data: existingFollow } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();

  if (existingFollow) {
    // Já está seguindo, então deixar de seguir
    const result = await unfollowUser(userId);
    return { ...result, isFollowing: false };
  } else {
    // Não está seguindo, então seguir
    const result = await followUser(userId);
    return { ...result, isFollowing: result.success };
  }
}

/**
 * Verificar se está seguindo um usuário
 */
export async function checkIsFollowing(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();

  return !!data;
}

/**
 * Buscar lista de seguidores de um usuário
 */
export async function getFollowers(
  userId: string,
  cursor?: string
): Promise<PaginatedUsersResponse> {
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  let query = supabase
    .from('user_follows')
    .select(`
      id,
      created_at,
      follower:users!user_follows_follower_id_fkey (
        id,
        full_name,
        avatar_url,
        bio,
        is_creator,
        followers_count,
        following_count
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar seguidores:', error);
    return { data: [], nextCursor: null, hasMore: false };
  }

  const hasMore = data.length > PAGE_SIZE;
  const items = hasMore ? data.slice(0, PAGE_SIZE) : data;

  // Se usuário está logado, verificar quais ele segue
  let followingIds: string[] = [];
  if (currentUser) {
    const followerIds = items.map((item: any) => item.follower.id);
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', followerIds);

    followingIds = followingData?.map((f: any) => f.following_id) || [];
  }

  const users: UserWithFollowStatus[] = items.map((item: any) => ({
    ...item.follower,
    is_following: followingIds.includes(item.follower.id),
  }));

  return {
    data: users,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
    hasMore,
  };
}

/**
 * Buscar lista de quem o usuário segue
 */
export async function getFollowing(
  userId: string,
  cursor?: string
): Promise<PaginatedUsersResponse> {
  const supabase = await createClient();

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  let query = supabase
    .from('user_follows')
    .select(`
      id,
      created_at,
      following:users!user_follows_following_id_fkey (
        id,
        full_name,
        avatar_url,
        bio,
        is_creator,
        followers_count,
        following_count
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar seguindo:', error);
    return { data: [], nextCursor: null, hasMore: false };
  }

  const hasMore = data.length > PAGE_SIZE;
  const items = hasMore ? data.slice(0, PAGE_SIZE) : data;

  // Se usuário está logado, verificar quais ele segue
  let followingIds: string[] = [];
  if (currentUser) {
    const targetIds = items.map((item: any) => item.following.id);
    const { data: followingData } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', currentUser.id)
      .in('following_id', targetIds);

    followingIds = followingData?.map((f: any) => f.following_id) || [];
  }

  const users: UserWithFollowStatus[] = items.map((item: any) => ({
    ...item.following,
    is_following: followingIds.includes(item.following.id),
  }));

  return {
    data: users,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
    hasMore,
  };
}

/**
 * Buscar perfil público de um usuário
 */
export async function getPublicProfileById(userId: string): Promise<PublicProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      avatar_url,
      bio,
      is_creator,
      instagram_handle,
      tiktok_handle,
      youtube_handle,
      twitter_handle,
      website_url,
      followers_count,
      following_count,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Contar posts aprovados
  const { count: postsCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved');

  return {
    ...profile,
    followers_count: profile.followers_count || 0,
    following_count: profile.following_count || 0,
    posts_count: postsCount || 0,
  };
}

/**
 * Buscar estatísticas do perfil
 */
export async function getProfileStatsById(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  // Posts aprovados
  const { count: postsCount } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'approved');

  // Total de likes recebidos
  const { data: posts } = await supabase
    .from('posts')
    .select('likes_count')
    .eq('user_id', userId)
    .eq('status', 'approved');

  const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

  // Contadores de follow
  const { data: user } = await supabase
    .from('users')
    .select('followers_count, following_count')
    .eq('id', userId)
    .single();

  return {
    posts_count: postsCount || 0,
    followers_count: user?.followers_count || 0,
    following_count: user?.following_count || 0,
    total_likes: totalLikes,
  };
}

/**
 * Buscar sugestões de usuários para seguir
 */
export async function getSuggestedUsers(limit: number = 5): Promise<SuggestedUser[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Buscar IDs de quem o usuário já segue
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id);

  const followingIds = following?.map((f) => f.following_id) || [];

  // Buscar usuários populares que o usuário não segue
  const { data: suggestions, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      avatar_url,
      bio,
      is_creator,
      followers_count,
      following_count
    `)
    .neq('id', user.id)
    .not('id', 'in', `(${followingIds.length > 0 ? followingIds.join(',') : 'null'})`)
    .order('followers_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }

  return (suggestions || []).map((u) => ({
    ...u,
    followers_count: u.followers_count || 0,
    following_count: u.following_count || 0,
    is_following: false,
    reason: u.is_creator ? 'creator' as const : 'popular' as const,
  }));
}

/**
 * Buscar posts de quem o usuário segue (para feed "Seguindo")
 */
export async function getFollowingFeed(cursor?: string, limit: number = 10) {
  const supabase = await createClient();

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

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_user_id_fkey (
        id,
        full_name,
        avatar_url,
        is_creator
      )
    `)
    .eq('status', 'approved')
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar feed de seguindo:', error);
    return { data: [], nextCursor: null, hasMore: false };
  }

  const hasMore = data.length > limit;
  const posts = hasMore ? data.slice(0, limit) : data;

  return {
    data: posts,
    nextCursor: hasMore ? posts[posts.length - 1].created_at : null,
    hasMore,
  };
}
