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
  console.log('toggleRewardActive: Iniciando', { rewardId, isActive });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    console.log('toggleRewardActive: userCheck', userCheck);

    if (userCheck.error) {
      console.log('toggleRewardActive: Usuario nao autenticado');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    console.log('toggleRewardActive: authCheck', authCheck);

    if (authCheck.error) {
      console.log('toggleRewardActive: Nao autorizado');
      return authCheck;
    }

    const supabase = await createClient();

    console.log('toggleRewardActive: Executando update...');
    const { error, data } = await supabase
      .from('rewards')
      .update({ is_active: isActive })
      .eq('id', rewardId)
      .select();

    console.log('toggleRewardActive: Resultado update', { error, data });

    if (error) {
      console.log('toggleRewardActive: Erro no update', error);
      return { error: 'Erro ao atualizar recompensa' };
    }

    console.log('toggleRewardActive: Sucesso! Revalidando paths...');
    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch (err) {
    console.error('toggleRewardActive: Erro inesperado', err);
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

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
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

    revalidatePath('/admin/usuarios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Deletar recompensa (admin)
 * Só permite deletar se não houver claims pendentes/aprovados/enviados
 */
export async function deleteReward(rewardId: string): Promise<ActionResponse> {
  console.log('deleteReward: Iniciando para rewardId:', rewardId);

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    console.log('deleteReward: userCheck:', userCheck);

    if (userCheck.error) {
      console.log('deleteReward: Usuario nao autenticado');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    console.log('deleteReward: authCheck:', authCheck);

    if (authCheck.error) {
      console.log('deleteReward: Acesso nao autorizado');
      return authCheck;
    }

    const supabase = await createClient();

    // Verificar se existem claims ativos (pendentes, aprovados ou enviados)
    const { count: activeClaims, error: claimsError } = await supabase
      .from('reward_claims')
      .select('*', { count: 'exact', head: true })
      .eq('reward_id', rewardId)
      .in('status', ['pending', 'approved', 'shipped']);

    console.log('deleteReward: activeClaims:', activeClaims, 'Error:', claimsError);

    if (activeClaims && activeClaims > 0) {
      console.log('deleteReward: Bloqueado por claims ativos');
      return {
        error: `Não é possível excluir. Existem ${activeClaims} resgate(s) pendente(s)/em andamento.`
      };
    }

    // Deletar a recompensa
    console.log('deleteReward: Executando delete...');
    const { error, count } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    console.log('deleteReward: Resultado delete - Error:', error, 'Count:', count);

    if (error) {
      console.error('Error deleting reward:', error);
      return { error: 'Erro ao excluir recompensa' };
    }

    console.log('deleteReward: Sucesso! Revalidando paths...');
    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch (err) {
    console.error('Error in deleteReward:', err);
    return { error: 'Erro interno do servidor' };
  }
}
