/**
 * Exportacoes centralizadas de tipos
 */

// Tipos de Actions
export * from './action';

// Tipos de Post
export * from './post';

// Tipos de Perfil
export * from './profile';

// Tipos de Analytics
export * from './analytics';

// Tipos de Notificacoes
export * from './notification';

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
  // Notifications
  NotificationChannel,
  NotificationStatus,
  ScheduledTaskType,
  ScheduledTaskStatus,
  NotificationLogRow,
  ScheduledTaskRow,
  NotificationLogWithLead,
} from '@/lib/supabase/types';
