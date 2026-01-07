'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UpdateProfileData } from '@/types/profile';
import { ActionResponse } from '@/types';

/**
 * Atualizar perfil do usuario
 */
export async function updateProfile(data: UpdateProfileData): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    const { error } = await supabase
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      return { error: 'Erro ao atualizar perfil' };
    }

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Buscar perfil atual do usuario
 */
export async function getCurrentProfile() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Buscar estatisticas do usuario
 */
export async function getProfileStats() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    // Buscar estatisticas dos posts
    const { data: posts } = await supabase
      .from('posts')
      .select('id, status, likes_count')
      .eq('user_id', user.id);

    const allPosts = posts || [];
    const approvedPosts = allPosts.filter((p) => p.status === 'approved');
    const totalLikes = approvedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

    return {
      total_posts: allPosts.length,
      approved_posts: approvedPosts.length,
      total_likes: totalLikes,
    };
  } catch {
    return null;
  }
}

/**
 * Buscar perfil publico de um usuario
 */
export async function getPublicProfile(userId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, bio, instagram_handle, tiktok_handle, youtube_handle, twitter_handle, website_url, role, is_creator, created_at')
      .eq('id', userId)
      .single();

    if (error) return null;

    return data;
  } catch {
    return null;
  }
}
