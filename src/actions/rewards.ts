'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';

/**
 * Resgatar uma recompensa
 */
export async function claimReward(rewardId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Buscar recompensa
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError || !reward) {
      return { error: 'Recompensa nao encontrada' };
    }

    // Verificar estoque
    if (reward.quantity_available <= 0) {
      return { error: 'Estoque esgotado' };
    }

    // Buscar saldo do usuario
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!userCoins || userCoins.balance < reward.coins_required) {
      return { error: 'Saldo insuficiente' };
    }

    // Criar resgate
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        status: 'pending',
        coins_spent: reward.coins_required,
      })
      .select()
      .single();

    if (claimError) {
      return { error: 'Erro ao criar resgate' };
    }

    // Deduzir moedas do saldo
    const { error: balanceError } = await supabase
      .from('user_coins')
      .update({
        balance: userCoins.balance - reward.coins_required,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (balanceError) {
      // Rollback do resgate
      await supabase.from('reward_claims').delete().eq('id', claim.id);
      return { error: 'Erro ao deduzir saldo' };
    }

    // Registrar transacao
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -reward.coins_required,
        type: 'spent',
        description: `Resgate: ${reward.name}`,
        reference_id: claim.id,
      });

    // Decrementar estoque
    await supabase
      .from('rewards')
      .update({
        quantity_available: reward.quantity_available - 1,
      })
      .eq('id', rewardId);

    revalidatePath('/premios');
    revalidatePath('/dashboard');
    return { success: true, data: claim };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Cancelar resgate (apenas se pendente)
 */
export async function cancelClaim(claimId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Buscar resgate
    const { data: claim } = await supabase
      .from('reward_claims')
      .select('*, rewards(*)')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (!claim) {
      return { error: 'Resgate nao encontrado ou nao pode ser cancelado' };
    }

    // Atualizar status
    const { error: updateError } = await supabase
      .from('reward_claims')
      .update({ status: 'cancelled' })
      .eq('id', claimId);

    if (updateError) {
      return { error: 'Erro ao cancelar resgate' };
    }

    // Devolver moedas
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (userCoins) {
      await supabase
        .from('user_coins')
        .update({
          balance: userCoins.balance + claim.coins_spent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Registrar transacao de estorno
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: user.id,
          amount: claim.coins_spent,
          type: 'earned',
          description: `Estorno: ${(claim as any).rewards?.name || 'Resgate cancelado'}`,
          reference_id: claimId,
        });
    }

    // Devolver ao estoque
    await supabase.rpc('increment_reward_stock', { reward_id: claim.reward_id });

    revalidatePath('/premios');
    revalidatePath('/dashboard');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
