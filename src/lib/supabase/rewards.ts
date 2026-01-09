/**
 * Queries para Recompensas e Moedas
 */

import { createClient } from './server';
import type {
  Reward,
  RewardWithAvailability,
  UserCoins,
  CoinTransaction,
  RewardClaim,
  RewardClaimWithDetails,
  ClaimWithReward,
  ClaimWithUserAndReward,
} from './types';

/**
 * Buscar todas as recompensas ativas
 */
export async function getActiveRewards(): Promise<RewardWithAvailability[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Paralelizar busca de rewards e user coins usando Promise.all
  const [rewardsResult, coinsResult] = await Promise.all([
    // Query 1: Buscar recompensas ativas
    supabase
      .from('rewards')
      .select('*')
      .eq('is_active', true)
      .order('coins_required', { ascending: true }),

    // Query 2: Buscar saldo do usuário (se existir)
    user
      ? supabase
          .from('user_coins')
          .select('balance')
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (rewardsResult.error || !rewardsResult.data) return [];

  const userBalance = coinsResult.data?.balance || 0;

  return rewardsResult.data.map((reward) => ({
    ...reward,
    can_claim: reward.quantity_available > 0 && userBalance >= reward.coins_required,
  })) as RewardWithAvailability[];
}

/**
 * Buscar recompensa por ID
 */
export async function getRewardById(rewardId: string): Promise<RewardWithAvailability | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Paralelizar busca de reward e user coins usando Promise.all
  const [rewardResult, coinsResult] = await Promise.all([
    // Query 1: Buscar recompensa
    supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single(),

    // Query 2: Buscar saldo do usuário (se existir)
    user
      ? supabase
          .from('user_coins')
          .select('balance')
          .eq('user_id', user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (rewardResult.error || !rewardResult.data) return null;

  const userBalance = coinsResult.data?.balance || 0;

  return {
    ...rewardResult.data,
    can_claim: rewardResult.data.quantity_available > 0 && userBalance >= rewardResult.data.coins_required,
  } as RewardWithAvailability;
}

/**
 * Buscar saldo de moedas do usuário
 */
export async function getUserCoins(): Promise<UserCoins | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_coins')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) return null;

  return data;
}

/**
 * Buscar histórico de transações do usuário
 */
export async function getUserTransactions(limit = 20): Promise<CoinTransaction[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data || [];
}

/**
 * Buscar resgates do usuário
 */
export async function getUserClaims(): Promise<RewardClaimWithDetails[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('reward_claims')
    .select('*, rewards(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((claim: ClaimWithReward) => ({
    ...claim,
    reward: claim.rewards,
    rewards: undefined,
  })) as RewardClaimWithDetails[];
}

/**
 * Buscar todos os resgates pendentes (para admin)
 */
export async function getPendingClaims(): Promise<(RewardClaim & {
  user: { id: string; full_name: string | null; email: string; avatar_url: string | null; };
  reward: Reward
})[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reward_claims')
    .select('*, rewards(*), users(id, full_name, email, avatar_url)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data
    .filter((claim: ClaimWithUserAndReward) => claim.rewards && claim.users)
    .map((claim: ClaimWithUserAndReward) => ({
      ...claim,
      reward: claim.rewards!,
      user: claim.users!,
      rewards: undefined,
      users: undefined,
    }));
}

/**
 * Buscar estatísticas de recompensas
 */
export async function getRewardsStats() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [coinsResult, claimsResult, transactionsResult] = await Promise.all([
    supabase.from('user_coins').select('balance').eq('user_id', user.id).single(),
    supabase.from('reward_claims').select('id, status').eq('user_id', user.id),
    supabase
      .from('coin_transactions')
      .select('amount, type')
      .eq('user_id', user.id),
  ]);

  const claims = claimsResult.data || [];
  const transactions = transactionsResult.data || [];

  const totalEarned = transactions
    .filter((t) => t.type === 'earned')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter((t) => t.type === 'spent')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    current_balance: coinsResult.data?.balance || 0,
    total_earned: totalEarned,
    total_spent: totalSpent,
    total_claims: claims.length,
    pending_claims: claims.filter((c) => c.status === 'pending').length,
    delivered_claims: claims.filter((c) => c.status === 'delivered').length,
  };
}

/**
 * Verificar se usuário pode resgatar recompensa
 */
export async function canClaimReward(rewardId: string): Promise<{ canClaim: boolean; reason?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { canClaim: false, reason: 'Usuario nao autenticado' };
  }

  const [rewardResult, coinsResult] = await Promise.all([
    supabase.from('rewards').select('*').eq('id', rewardId).single(),
    supabase.from('user_coins').select('balance').eq('user_id', user.id).single(),
  ]);

  const reward = rewardResult.data;
  const userCoins = coinsResult.data;

  if (!reward) {
    return { canClaim: false, reason: 'Recompensa nao encontrada' };
  }

  if (!reward.is_active) {
    return { canClaim: false, reason: 'Recompensa nao disponivel' };
  }

  if (reward.quantity_available <= 0) {
    return { canClaim: false, reason: 'Estoque esgotado' };
  }

  if (!userCoins || userCoins.balance < reward.coins_required) {
    return { canClaim: false, reason: 'Saldo insuficiente' };
  }

  return { canClaim: true };
}
