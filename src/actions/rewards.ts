'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAdminOrCreator, isAuthError } from '@/lib/auth';

type ActionResponse = {
  error?: string;
  success?: boolean;
  data?: any;
};

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

// ============ ADMIN ACTIONS ============

/**
 * Ativar/Desativar recompensa (admin)
 */
export async function toggleRewardActive(
  rewardId: string,
  isActive: boolean
): Promise<ActionResponse> {
  try {
    // Verificar autorizacao
    const auth = await requireAdminOrCreator();
    if (isAuthError(auth)) {
      return auth;
    }

    const { supabase } = auth;

    const { error } = await supabase
      .from('rewards')
      .update({ is_active: isActive })
      .eq('id', rewardId);

    if (error) {
      return { error: 'Erro ao atualizar recompensa' };
    }

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Aprovar resgate (admin)
 */
export async function approveClaim(claimId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'approved' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao aprovar resgate' };
    }

    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Marcar resgate como enviado (admin)
 */
export async function markClaimShipped(claimId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'shipped' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao atualizar status' };
    }

    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Marcar resgate como entregue (admin)
 */
export async function markClaimDelivered(claimId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'delivered' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao atualizar status' };
    }

    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Criar recompensa (admin)
 */
export async function createReward(data: {
  name: string;
  description?: string | null;
  image_url?: string | null;
  coins_cost: number;
  stock?: number | null;
  type: 'digital' | 'physical';
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    const { data: reward, error } = await supabase
      .from('rewards')
      .insert({
        name: data.name,
        description: data.description || null,
        image_url: data.image_url || null,
        coins_cost: data.coins_cost,
        stock: data.stock || null,
        type: data.type,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return { error: 'Erro ao criar recompensa' };
    }

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true, data: reward };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Atualizar recompensa (admin)
 */
export async function updateReward(
  rewardId: string,
  data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    coinsRequired: number;
    quantityAvailable: number;
    isActive: boolean;
  }>
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { error: 'Acesso nao autorizado' };
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.coinsRequired !== undefined) updateData.coins_required = data.coinsRequired;
    if (data.quantityAvailable !== undefined) updateData.quantity_available = data.quantityAvailable;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { error } = await supabase
      .from('rewards')
      .update(updateData)
      .eq('id', rewardId);

    if (error) {
      return { error: 'Erro ao atualizar recompensa' };
    }

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Adicionar moedas a um usuario (admin)
 */
export async function addCoinsToUser(
  userId: string,
  amount: number,
  description: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuario nao autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso nao autorizado' };
    }

    if (amount <= 0) {
      return { error: 'Quantidade deve ser maior que zero' };
    }

    // Buscar saldo atual
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!userCoins) {
      // Criar registro de saldo se nao existir
      await supabase
        .from('user_coins')
        .insert({
          user_id: userId,
          balance: amount,
        });
    } else {
      // Atualizar saldo
      await supabase
        .from('user_coins')
        .update({
          balance: userCoins.balance + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // Registrar transacao
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'earned',
        description: description,
      });

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
