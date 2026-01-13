/**
 * Factory functions para gerar dados de teste
 * Cada factory retorna objetos com valores padrão que podem ser sobrescritos
 */

import type {
  User,
  Reward,
  Challenge,
  UserCoins,
  ChallengeParticipant,
  RewardClaim,
  CoinTransaction,
} from '@/lib/supabase/types';
import type { PostWithAuthor } from '@/types/post';

let idCounter = 0;
const generateId = (): string => {
  idCounter += 1;
  return `test-id-${idCounter}`;
};

const generateTimestamp = (): string => new Date().toISOString();

/**
 * Reseta o contador de IDs - útil para testes isolados
 */
export const resetFactories = (): void => {
  idCounter = 0;
};

/**
 * Cria um usuário de teste
 */
export const createMockUser = (overrides: Partial<User> = {}): User => {
  const id = overrides.id || generateId();
  const now = generateTimestamp();

  return {
    id,
    email: `user-${id}@test.com`,
    full_name: `Test User ${id}`,
    avatar_url: null,
    bio: null,
    instagram_handle: null,
    tiktok_handle: null,
    youtube_handle: null,
    twitter_handle: null,
    website_url: null,
    role: 'fan',
    is_creator: false,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
};

/**
 * Cria um usuário admin de teste
 */
export const createMockAdmin = (overrides: Partial<User> = {}): User => {
  return createMockUser({
    role: 'creator',
    is_creator: true,
    full_name: 'Admin User',
    ...overrides,
  });
};

/**
 * Cria uma recompensa de teste
 */
export const createMockReward = (overrides: Partial<Reward> = {}): Reward => {
  const id = overrides.id || generateId();
  const now = generateTimestamp();

  return {
    id,
    name: `Reward ${id}`,
    description: `Description for reward ${id}`,
    image_url: null,
    coins_required: 100,
    quantity_available: 10,
    is_active: true,
    created_at: now,
    ...overrides,
  };
};

/**
 * Cria um desafio de teste
 */
export const createMockChallenge = (
  overrides: Partial<Challenge> = {}
): Challenge => {
  const id = overrides.id || generateId();
  const now = generateTimestamp();

  return {
    id,
    title: `Challenge ${id}`,
    description: `Description for challenge ${id}`,
    type: 'fisico',
    icon: '🏃',
    is_active: true,
    thumbnail_url: null,
    instagram_embed_url: null,
    prize_amount: null,
    num_winners: 1,
    goal_type: 'repetitions',
    goal_value: 10,
    record_video_url: null,
    hashtag: null,
    profile_to_tag: null,
    coins_reward: 50,
    starts_at: now,
    ends_at: null,
    status: 'active',
    created_at: now,
    ...overrides,
  };
};

/**
 * Cria um registro de saldo de moedas de teste
 */
export const createMockUserCoins = (
  overrides: Partial<UserCoins> = {}
): UserCoins => {
  const id = overrides.id || generateId();
  const userId = overrides.user_id || generateId();
  const now = generateTimestamp();

  return {
    id,
    user_id: userId,
    balance: 100,
    updated_at: now,
    ...overrides,
  };
};

/**
 * Cria uma participação em desafio de teste
 */
export const createMockParticipation = (
  overrides: Partial<ChallengeParticipant> = {}
): ChallengeParticipant => {
  const id = overrides.id || generateId();
  const challengeId = overrides.challenge_id || generateId();
  const userId = overrides.user_id || generateId();
  const now = generateTimestamp();

  return {
    id,
    challenge_id: challengeId,
    user_id: userId,
    result_value: 10,
    video_proof_url: null,
    social_media_url: null,
    status: 'pending',
    approved_by: null,
    approved_at: null,
    coins_earned: 0,
    created_at: now,
    ai_is_valid: null,
    ai_confidence: null,
    ai_reason: null,
    ai_observed_value: null,
    ai_analyzed_at: null,
    instagram_proof_url: null,
    ai_instagram_is_valid: null,
    ai_instagram_confidence: null,
    ai_instagram_reason: null,
    ai_is_suspicious: false,
    ...overrides,
  };
};

/**
 * Cria um resgate de recompensa de teste
 */
export const createMockRewardClaim = (
  overrides: Partial<RewardClaim> = {}
): RewardClaim => {
  const id = overrides.id || generateId();
  const userId = overrides.user_id || generateId();
  const rewardId = overrides.reward_id || generateId();
  const now = generateTimestamp();

  return {
    id,
    user_id: userId,
    reward_id: rewardId,
    status: 'pending',
    coins_spent: 100,
    created_at: now,
    ...overrides,
  };
};

/**
 * Cria uma transação de moedas de teste
 */
export const createMockCoinTransaction = (
  overrides: Partial<CoinTransaction> = {}
): CoinTransaction => {
  const id = overrides.id || generateId();
  const userId = overrides.user_id || generateId();
  const now = generateTimestamp();

  return {
    id,
    user_id: userId,
    amount: 50,
    type: 'earned',
    description: 'Test transaction',
    reference_id: null,
    created_at: now,
    ...overrides,
  };
};

/**
 * Cria um perfil (compatível com a tabela profiles usada nos actions)
 */
export const createMockProfile = (
  overrides: Partial<{ id: string; role: string; is_creator: boolean }> = {}
) => {
  const id = overrides.id || generateId();

  return {
    id,
    role: 'fan',
    is_creator: false,
    ...overrides,
  };
};

/**
 * Cria múltiplos registros usando uma factory
 */
export const createMany = <T>(
  factory: (overrides?: any) => T,
  count: number,
  overrides: Partial<T> | ((index: number) => Partial<T>) = {}
): T[] => {
  return Array.from({ length: count }, (_, index) => {
    const itemOverrides =
      typeof overrides === 'function' ? overrides(index) : overrides;
    return factory(itemOverrides);
  });
};

/**
 * Cria um post de teste com autor
 */
export const createMockPost = (
  overrides: Partial<PostWithAuthor> = {}
): PostWithAuthor => {
  const id = overrides.id || generateId();
  const userId = overrides.user_id || generateId();
  const now = generateTimestamp();

  // Cria dados do autor se não fornecido
  const author = overrides.author || {
    id: userId,
    full_name: `Author ${userId}`,
    avatar_url: null,
    is_creator: false,
  };

  return {
    id,
    user_id: userId,
    title: `Post ${id}`,
    content: `Content for post ${id}`,
    type: 'community',
    status: 'approved',
    media_type: 'none',
    media_url: null,
    youtube_url: null,
    instagram_url: null,
    likes_count: 0,
    comments_count: 0,
    vote_score: 0,
    is_featured: false,
    content_category: 'normal' as const,
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
    created_at: now,
    updated_at: now,
    author,
    ...overrides,
  };
};
