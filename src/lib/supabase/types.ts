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
export type PostStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

// Categoria de conteúdo do post
export type ContentCategory = 'normal' | 'help_request';

// Tipo de mídia do post
export type MediaType = 'none' | 'image' | 'carousel' | 'youtube' | 'instagram';

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
          media_type: MediaType
          youtube_url: string | null
          instagram_url: string | null
          type: PostType
          status: PostStatus
          content_category: ContentCategory
          likes_count: number
          comments_count: number
          vote_score: number
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
          media_type?: MediaType
          youtube_url?: string | null
          instagram_url?: string | null
          type?: PostType
          status?: PostStatus
          content_category?: ContentCategory
          likes_count?: number
          comments_count?: number
          vote_score?: number
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
          media_type?: MediaType
          youtube_url?: string | null
          instagram_url?: string | null
          type?: PostType
          status?: PostStatus
          content_category?: ContentCategory
          likes_count?: number
          comments_count?: number
          vote_score?: number
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

/**
 * Tipo para post com dados do usuário associado (join com users)
 * Usado em queries que fazem join com a tabela users retornando campos específicos
 */
export interface PostWithUsers extends Post {
  users: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_creator: boolean;
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

/**
 * Tipo para registro de evento com dados do evento associado
 * Usado quando fazemos join com a tabela events
 */
export interface EventRegistrationWithEvent extends EventRegistration {
  events: Event | null;
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
  thumbnail_url: string | null;
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
  instagram_proof_url: string | null;
  status: ParticipationStatus;
  approved_by: string | null;
  approved_at: string | null;
  coins_earned: number;
  created_at: string;
  // Campos de análise de IA (YouTube)
  ai_is_valid: boolean | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  ai_observed_value: number | null;
  ai_analyzed_at: string | null;
  // Campos de análise de IA (Instagram)
  ai_instagram_is_valid: boolean | null;
  ai_instagram_confidence: number | null;
  ai_instagram_reason: string | null;
  // Flag de conteúdo suspeito
  ai_is_suspicious: boolean;
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

/**
 * Tipos de prêmio disponíveis para desafios
 */
export type PrizeType = 'physical' | 'digital' | 'money';

/**
 * Prêmio de um desafio (físico, digital ou dinheiro)
 */
export interface ChallengePrize {
  id: string;
  challenge_id: string;
  type: PrizeType;
  name: string;
  description: string | null;
  value: number | null;
  quantity: number;
  image_url: string | null;
  created_at: string;
}

/**
 * Input para criar/editar prêmio (sem id e challenge_id)
 */
export interface PrizeInput {
  type: PrizeType;
  name: string;
  description?: string;
  value?: number;
  quantity: number;
  image_url?: string;
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
 * Tipo de meta do desafio
 */
export type GoalType = 'repetitions' | 'time';

/**
 * Tipo para participação com dados do desafio associado
 * Usado quando fazemos join com a tabela challenges
 */
export interface ParticipationWithChallenge extends ChallengeParticipant {
  challenges: {
    title: string;
    goal_type: GoalType | null;
    goal_value: number | null;
    coins_reward: number;
  } | null;
}

/**
 * Tipo para participação com dados do usuário associado (join com users)
 * Usado em queries que fazem join com a tabela users retornando campos específicos
 */
export interface ParticipantWithUsers extends ChallengeParticipant {
  users: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

/**
 * Tipo para participação com dados do usuário e do desafio associados
 * Usado quando fazemos join com as tabelas users e challenges
 */
export interface ParticipantWithUsersAndChallenge extends ChallengeParticipant {
  users: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  challenges: {
    title: string;
    type: ChallengeType;
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

/**
 * Tipo para resgate com dados da recompensa associada
 * Usado quando fazemos join com a tabela rewards
 */
export interface ClaimWithReward extends RewardClaim {
  rewards: Reward | null;
}

/**
 * Tipo para resgate com dados do usuário e da recompensa associados
 * Usado quando fazemos join com as tabelas users e rewards
 */
export interface ClaimWithUserAndReward extends RewardClaim {
  users: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  rewards: Reward | null;
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

// ============ LEADS NPS ============

export type LeadStatus = 'pending' | 'approved' | 'rejected';

export interface NpsLead {
  id: string;
  score: number;
  reason: string;
  reason_length: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string | null;
  whatsapp_opted_in: boolean;
  created_at: string;
  updated_at: string;
  // Campos de analise AI
  ai_score: number | null;
  ai_sentiment: 'positivo' | 'neutro' | 'negativo' | null;
  ai_recommendation: 'aprovar' | 'analisar' | 'rejeitar' | null;
  ai_summary: string | null;
  ai_strengths: string[] | null;
  ai_concerns: string[] | null;
  ai_analyzed_at: string | null;
  // Campos de sequência de emails
  sequence_step: number;
  converted: boolean;
  converted_at: string | null;
  converted_user_id: string | null;
  // Campos de consentimento LGPD
  lgpd_consent_accepted: boolean;
  lgpd_consent_at: string | null;
  lgpd_consent_ip: string | null;
  // Campos de origem (landing page)
  source_type: 'landing_challenge' | 'landing_reward' | 'direct' | null;
  source_id: string | null;
  source_name: string | null;
}

export interface NpsLeadInsert {
  score: number;
  reason: string;
  name: string;
  email: string;
  phone?: string | null;
  lgpdConsent?: boolean;
  // Campos de origem (landing page)
  sourceType?: 'landing_challenge' | 'landing_reward' | 'direct';
  sourceId?: string;
  sourceName?: string;
}

export interface NpsLeadWithApprover extends NpsLead {
  approver?: {
    id: string;
    full_name: string | null;
  } | null;
}

// ============ LEADERBOARD ============

/**
 * Tiers de reconhecimento do sistema de leaderboard
 */
export type LeaderboardTier = 'bronze' | 'silver' | 'gold' | 'diamond';

/**
 * Períodos de tempo para filtrar rankings
 */
export type TimePeriod = 'weekly' | 'monthly' | 'all_time';

/**
 * Categorias de leaderboard disponíveis
 */
export type LeaderboardCategory = 'coins' | 'challenges' | 'combined';

// ============ NOTIFICACOES ============

/**
 * Canal de notificacao
 */
export type NotificationChannel = 'email' | 'whatsapp';

/**
 * Status da notificacao
 */
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'failed' | 'cancelled';

/**
 * Tipo da tarefa agendada
 */
export type ScheduledTaskType = 'check_email_opened' | 'send_reminder' | 'cleanup' | 'send_email_2' | 'send_whatsapp_final';

/**
 * Status da tarefa agendada
 */
export type ScheduledTaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Log de notificacao no banco de dados
 */
export interface NotificationLogRow {
  id: string;
  lead_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  external_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  sequence_step: number;
}

/**
 * Tarefa agendada no banco de dados
 */
export interface ScheduledTaskRow {
  id: string;
  type: ScheduledTaskType;
  lead_id: string | null;
  scheduled_for: string;
  status: ScheduledTaskStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Log de notificacao com dados do lead associado
 */
export interface NotificationLogWithLead extends NotificationLogRow {
  nps_leads: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

/**
 * Entrada individual no leaderboard
 */
export interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  score: number;
  tier: LeaderboardTier;
  rank: number;
  last_activity?: string | null;
}

/**
 * Ranking individual do usuário
 */
export interface UserRanking {
  user_id: string;
  rank: number;
  score: number;
  tier: LeaderboardTier;
  total_participants: number;
  category: LeaderboardCategory;
  period: TimePeriod;
}
