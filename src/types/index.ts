/**
 * Exportacoes centralizadas de tipos
 */

// Tipos de Post
export * from './post';

// Tipos de Perfil
export * from './profile';

// Re-export tipos do Supabase
export type {
  // Database
  Database,
  Json,
  // Users
  User,
  UserRole,
  UserWithStats,
  CreatorProfile,
  // Posts
  Post,
  PostType,
  PostStatus,
  PostLike,
  PostComment,
  PostWithAuthor,
  CommentWithAuthor,
  // Events
  Event,
  EventStatus,
  EventRegistration,
  EventWithRegistration,
  // Challenges
  Challenge,
  ChallengeType,
  ChallengeStatus,
  ChallengeParticipant,
  ChallengeWinner,
  ChallengeWithStats,
  ChallengeParticipantWithUser,
  ParticipationStatus,
  // Rewards
  Reward,
  RewardClaimStatus,
  RewardClaim,
  RewardWithAvailability,
  RewardClaimWithDetails,
  UserCoins,
  CoinTransaction,
  CoinTransactionType,
  // External Submissions
  ExternalSubmission,
  VerificationStatus,
} from '@/lib/supabase/types';
