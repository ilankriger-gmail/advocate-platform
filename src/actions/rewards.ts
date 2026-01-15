'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from '@/types/action';
import type { Reward, RewardClaim, ClaimWithReward } from '@/lib/supabase/types';
import { logger, sanitizeError } from '@/lib';
import { notifyRewardClaimed, notifyRewardShipped } from '@/actions/notifications';

// Logger contextualizado para o módulo de rewards
const rewardsLogger = logger.withContext('[Rewards]');

/**
 * Interface para endereço de entrega
 */
export interface DeliveryAddress {
  recipient_name: string;  // Nome de quem vai receber o produto
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  // Seleções do produto
  size?: string;   // Tamanho selecionado (PP, P, M, G, GG, XG)
  color?: string;  // Cor selecionada
}

/**
 * Resgatar uma recompensa
 * @param rewardId ID da recompensa
 * @param deliveryAddress Endereço de entrega (obrigatório para prêmios físicos)
 */
export async function claimReward(
  rewardId: string,
  deliveryAddress?: DeliveryAddress
): Promise<ActionResponse<RewardClaim>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Buscar recompensa
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('is_active', true)
      .single();

    if (rewardError || !reward) {
      return { error: 'Recompensa não encontrada' };
    }

    // Verificar se é prêmio físico e exige endereço
    if (reward.type === 'physical' && !deliveryAddress) {
      return { error: 'Endereço de entrega é obrigatório para prêmios físicos' };
    }

    // Validar endereço se fornecido
    if (deliveryAddress) {
      if (!deliveryAddress.cep || !deliveryAddress.street || !deliveryAddress.number ||
          !deliveryAddress.neighborhood || !deliveryAddress.city || !deliveryAddress.state) {
        return { error: 'Preencha todos os campos obrigatórios do endereço' };
      }
    }

    // Verificar estoque
    if (reward.quantity_available !== null && reward.quantity_available <= 0) {
      return { error: 'Estoque esgotado' };
    }

    // Buscar saldo do usuário
    const { data: userCoins } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (!userCoins || userCoins.balance < reward.coins_required) {
      return { error: 'Saldo insuficiente' };
    }

    // Criar resgate com endereço de entrega
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert({
        user_id: user.id,
        reward_id: rewardId,
        status: 'pending',
        coins_spent: reward.coins_required,
        delivery_address: deliveryAddress || null,
      })
      .select()
      .single();

    if (claimError) {
      rewardsLogger.error('Erro ao criar resgate', { error: sanitizeError(claimError) });
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

    // Registrar transação
    await supabase
      .from('coin_transactions')
      .insert({
        user_id: user.id,
        amount: -reward.coins_required,
        type: 'spent',
        description: `Resgate: ${reward.name}`,
        reference_id: claim.id,
      });

    // Decrementar estoque (se não for ilimitado)
    if (reward.quantity_available !== null) {
      const { error: stockError } = await supabase
        .from('rewards')
        .update({
          quantity_available: reward.quantity_available - 1,
        })
        .eq('id', rewardId);

      if (stockError) {
        rewardsLogger.error('Erro ao decrementar estoque', { error: stockError.message, rewardId });
        // Não falha a operação - resgate já foi criado
      }
    }

    rewardsLogger.info('Resgate criado com sucesso', {
      claimId: claim.id,
      rewardId,
      hasDeliveryAddress: !!deliveryAddress
    });

    // Notificar usuário do resgate bem-sucedido
    try {
      await notifyRewardClaimed(user.id, reward.name, rewardId);
    } catch (notifyError) {
      rewardsLogger.error('Erro ao enviar notificação de resgate', { error: sanitizeError(notifyError) });
    }

    revalidatePath('/premios');
    revalidatePath('/dashboard');
    return { success: true, data: claim };
  } catch (err) {
    rewardsLogger.error('Erro ao resgatar recompensa', { error: sanitizeError(err) });
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
      return { error: 'Usuário não autenticado' };
    }

    // Buscar resgate
    const { data: claim } = await supabase
      .from('reward_claims')
      .select('*, rewards(*)')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single() as { data: ClaimWithReward | null };

    if (!claim) {
      return { error: 'Resgate não encontrado ou não pode ser cancelado' };
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
          description: `Estorno: ${claim.rewards?.name || 'Resgate cancelado'}`,
          reference_id: claimId,
        });
    }

    // Devolver ao estoque
    const { error: stockError } = await supabase.rpc('increment_reward_stock', { reward_id: claim.reward_id });
    if (stockError) {
      console.error('Erro ao restaurar estoque:', stockError.message);
      // Continua mesmo com erro - resgate já foi cancelado
    }

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
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

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
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
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
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    // Buscar dados do claim para notificação
    const { data: claim } = await supabase
      .from('reward_claims')
      .select('user_id, rewards(name)')
      .eq('id', claimId)
      .single();

    const { error } = await supabase
      .from('reward_claims')
      .update({ status: 'shipped' })
      .eq('id', claimId);

    if (error) {
      return { error: 'Erro ao atualizar status' };
    }

    // Notificar usuário do envio
    if (claim) {
      try {
        const rewardData = claim.rewards as unknown as { name: string } | null;
        await notifyRewardShipped(claim.user_id, rewardData?.name || 'Seu prêmio');
      } catch (notifyError) {
        rewardsLogger.error('Erro ao enviar notificação de envio', { error: sanitizeError(notifyError) });
      }
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
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
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
  coins_required: number;
  quantity_available?: number | null;
  type: 'digital' | 'physical';
}): Promise<ActionResponse<Reward>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    const { data: reward, error } = await supabase
      .from('rewards')
      .insert({
        name: data.name,
        description: data.description || null,
        image_url: data.image_url || null,
        coins_required: data.coins_required,
        quantity_available: data.quantity_available || null,
        type: data.type,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      rewardsLogger.error('Erro ao criar recompensa', { error: sanitizeError(error) });
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
 * Tipo para atualizações de recompensa
 */
type RewardUpdate = {
  name?: string;
  description?: string;
  image_url?: string;
  coins_required?: number;
  quantity_available?: number;
  is_active?: boolean;
};

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
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return { error: 'Acesso não autorizado' };
    }

    const updateData: RewardUpdate = {};
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
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
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

/**
 * Deletar recompensa (admin)
 * Só permite deletar se não houver claims pendentes/aprovados/enviados
 */
export async function deleteReward(rewardId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Usuário não autenticado' };
    }

    // Verificar se e admin/creator
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
      return { error: 'Acesso não autorizado' };
    }

    // Verificar se existem claims ativos (pendentes, aprovados ou enviados)
    const { count: activeClaims } = await supabase
      .from('reward_claims')
      .select('*', { count: 'exact', head: true })
      .eq('reward_id', rewardId)
      .in('status', ['pending', 'approved', 'shipped']);

    if (activeClaims && activeClaims > 0) {
      return {
        error: `Não é possível excluir. Existem ${activeClaims} resgate(s) pendente(s)/em andamento.`
      };
    }

    // Deletar a recompensa
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      rewardsLogger.error('Erro ao excluir recompensa', { error: sanitizeError(error) });
      return { error: 'Erro ao excluir recompensa' };
    }

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}