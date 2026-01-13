/**
 * Tipos para funcionalidades sociais (followers/following)
 */

// Relacionamento de follow
export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// Usuário com informações básicas para listas de followers
export interface UserPreview {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_creator: boolean;
  followers_count: number;
  following_count: number;
}

// Usuário na lista com status de follow
export interface UserWithFollowStatus extends UserPreview {
  is_following: boolean;
}

// Resposta paginada de followers/following
export interface PaginatedUsersResponse {
  data: UserWithFollowStatus[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

// Perfil público completo
export interface PublicProfile extends UserPreview {
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  twitter_handle: string | null;
  website_url: string | null;
  created_at: string;
  posts_count: number;
}

// Stats do perfil público
export interface ProfileStats {
  posts_count: number;
  followers_count: number;
  following_count: number;
  total_likes: number;
}

// Sugestão de usuário para seguir
export interface SuggestedUser extends UserPreview {
  mutual_followers_count?: number;
  reason?: 'popular' | 'mutual' | 'recent' | 'creator';
}
