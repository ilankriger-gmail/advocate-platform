/**
 * Tipos para a Plataforma de Comunidade de Criador
 * Modelo simplificado: Criador + Fãs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos de papel do usuário
export type UserRole = 'creator' | 'fan';

// Tipos de post
export type PostType = 'creator' | 'community';

// Status de post
export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          instagram_handle: string | null
          tiktok_handle: string | null
          youtube_handle: string | null
          twitter_handle: string | null
          website_url: string | null
          role: UserRole
          is_creator: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          role?: UserRole
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          youtube_handle?: string | null
          twitter_handle?: string | null
          website_url?: string | null
          role?: UserRole
          is_creator?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          media_url: string[] | null
          type: PostType
          status: PostStatus
          likes_count: number
          comments_count: number
          is_featured: boolean
          created_at: string
          updated_at: string
          rejection_reason: string | null
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          media_url?: string[] | null
          type?: PostType
          status?: PostStatus
          likes_count?: number
          comments_count?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          media_url?: string[] | null
          type?: PostType
          status?: PostStatus
          likes_count?: number
          comments_count?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          is_deleted?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_likes: {
        Args: { post_id: string }
        Returns: void
      }
      decrement_likes: {
        Args: { post_id: string }
        Returns: void
      }
    }
  }
}

// Tipos auxiliares exportados
export type User = Database['public']['Tables']['users']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];

// Tipos com relacionamentos
export interface UserWithStats extends User {
  posts_count?: number;
  followers_count?: number;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_creator: boolean;
  } | null;
}

export interface CommentWithAuthor extends PostComment {
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Tipo para o perfil do criador
export interface CreatorProfile extends User {
  posts_count: number;
  fans_count: number;
  total_likes: number;
}

// ============ EVENTOS ============

export type EventStatus = 'registered' | 'confirmed' | 'attended' | 'cancelled';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string | null;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  required_level: number;
  is_virtual: boolean;
  meeting_url: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registration_time: string;
  status: EventStatus;
  check_in_time: string | null;
  feedback: string | null;
}

export interface EventWithRegistration extends Event {
  registrations_count: number;
  is_registered: boolean;
  user_registration?: EventRegistration | null;
}

// ============ DESAFIOS ============

export type ChallengeType = 'engajamento' | 'fisico';
export type ChallengeStatus = 'active' | 'closed' | 'finished';
export type ParticipationStatus = 'pending' | 'approved' | 'rejected';

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  type: ChallengeType;
  icon: string;
  is_active: boolean;
  // Para engajamento
  instagram_embed_url: string | null;
  prize_amount: number | null;
  num_winners: number;
  // Para físico
  goal_type: 'repetitions' | 'time' | null;
  goal_value: number | null;
  record_video_url: string | null;
  hashtag: string | null;
  profile_to_tag: string | null;
  coins_reward: number;
  // Controle
  starts_at: string;
  ends_at: string | null;
  status: ChallengeStatus;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  result_value: number | null;
  video_proof_url: string | null;
  social_media_url: string | null;
  status: ParticipationStatus;
  approved_by: string | null;
  approved_at: string | null;
  coins_earned: number;
  created_at: string;
}

export interface ChallengeWinner {
  id: string;
  challenge_id: string;
  user_id: string | null;
  instagram_username: string | null;
  prize_amount: number | null;
  pix_sent: boolean;
  proof_image_url: string | null;
  created_at: string;
}

export interface ChallengeWithStats extends Challenge {
  participants_count: number;
  user_participation?: ChallengeParticipant | null;
}

export interface ChallengeParticipantWithUser extends ChallengeParticipant {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Tipo para participação com dados do desafio associado
 * Usado quando fazemos join com a tabela challenges
 */
export interface ParticipationWithChallenge extends ChallengeParticipant {
  challenges: {
    coins_reward: number;
  } | null;
}

// ============ RECOMPENSAS E MOEDAS ============

export type RewardClaimStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'cancelled';
export type CoinTransactionType = 'earned' | 'spent';

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  coins_required: number;
  quantity_available: number;
  is_active: boolean;
  created_at: string;
}

export interface UserCoins {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CoinTransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: RewardClaimStatus;
  coins_spent: number;
  created_at: string;
}

export interface RewardWithAvailability extends Reward {
  can_claim: boolean;
}

export interface RewardClaimWithDetails extends RewardClaim {
  reward: Reward;
}

// ============ SUBMISSÕES EXTERNAS ============

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface ExternalSubmission {
  id: string;
  user_id: string;
  platform: string;
  content_url: string;
  content_type: string;
  submission_date: string;
  verification_status: VerificationStatus;
  verified_by: string | null;
  verified_at: string | null;
  metrics: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
