'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';

/**
 * Ativar/Desativar recompensa (admin)
 */
export async function toggleRewardActive(
  rewardId: string,
  isActive: boolean
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('rewards')
      .update({ is_active: isActive })
      .eq('id', rewardId);

    if (error) {
      return { error: 'Erro ao atualizar recompensa' };
    }

    revalidatePath('/prêmios');
    revalidatePath('/admin/prêmios');
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
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'approved' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao aprovar resgate' };
    }

    revalidatePath('/admin/prêmios');
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
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'shipped' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao atualizar status' };
    }

    revalidatePath('/admin/prêmios');
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
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'delivered' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao atualizar status' };
    }

    revalidatePath('/admin/prêmios');
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
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

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
      return { error: 'Erro ao criar recompensa' };
    }

    revalidatePath('/prêmios');
    revalidatePath('/admin/prêmios');
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
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

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

    revalidatePath('/prêmios');
    revalidatePath('/admin/prêmios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Adicionar moedas a um usuário (admin)
 */
export async function addCoinsToUser(
  userId: string,
  amount: number,
  description: string
): Promise<ActionResponse> {
  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    if (amount <= 0) {
      return { error: 'Quantidade deve ser maior que zero' };
    }

    const supabase = await createClient();

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

    revalidatePath('/admin/usuários');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}
