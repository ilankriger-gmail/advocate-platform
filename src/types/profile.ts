/**
 * Tipos relacionados a Perfil de Usuário
 */

import { Database } from '@/lib/supabase/types';

// Tipos base do banco
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Role do usuário
export type UserRole = 'creator' | 'fan';

// Perfil público (sem dados sensiveis)
export interface PublicProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  website_url: string | null;
  role: UserRole;
  is_creator: boolean;
  created_at: string;
}

// Estatisticas do usuário
export interface UserStats {
  total_posts: number;
  approved_posts: number;
  total_likes: number;
}

// Perfil completo com estatisticas
export interface ProfileWithStats extends User {
  stats: UserStats;
}

// Dados para atualizar perfil
export interface UpdateProfileData {
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  twitter_handle?: string;
  website_url?: string;
}

// Badges de usuário
export const USER_BADGES = [
  { value: 'new', label: 'Novato', icon: 'Sprout', color: 'green' },
  { value: 'active', label: 'Ativo', icon: 'Flame', color: 'orange' },
  { value: 'contributor', label: 'Contribuidor', icon: 'Star', color: 'yellow' },
  { value: 'superfan', label: 'Super Fa', icon: 'Heart', color: 'red' },
] as const;

export type UserBadge = (typeof USER_BADGES)[number]['value'];
