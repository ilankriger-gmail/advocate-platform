'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from './types';
import { verifyAdminOrCreator, getAuthenticatedUser } from './utils';
import { logger, maskId, sanitizeError } from '@/lib';
import { generateRewardThumbnail } from '@/lib/ai/generate-reward-thumbnail';

// Logger contextualizado para o módulo de recompensas admin
const rewardsAdminLogger = logger.withContext('[RewardsAdmin]');

/**
 * Buscar recompensa por ID (admin)
 */
export async function getRewardById(rewardId: string): Promise<ActionResponse> {
  try {
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return userCheck;
    }
    const user = userCheck.data!;

    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return authCheck;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (error) {
      return { error: 'Recompensa não encontrada' };
    }

    return { success: true, data };
  } catch {
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Ativar/Desativar recompensa (admin)
 */
export async function toggleRewardActive(
  rewardId: string,
  isActive: boolean
): Promise<ActionResponse> {
  rewardsAdminLogger.info('Iniciando toggle de recompensa', {
    rewardId: maskId(rewardId),
    isActive
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    rewardsAdminLogger.debug('Verificação de usuário', {
      hasUser: !!userCheck.data,
      hasError: !!userCheck.error
    });

    if (userCheck.error) {
      rewardsAdminLogger.warn('Usuário não autenticado ao tentar toggle de recompensa');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    rewardsAdminLogger.debug('Verificação de autorização', {
      userId: maskId(user.id),
      isAuthorized: !authCheck.error
    });

    if (authCheck.error) {
      rewardsAdminLogger.warn('Usuário não autorizado ao tentar toggle de recompensa', {
        userId: maskId(user.id)
      });
      return authCheck;
    }

    const supabase = await createClient();

    rewardsAdminLogger.debug('Executando update de recompensa');
    const { error, data } = await supabase
      .from('rewards')
      .update({ is_active: isActive })
      .eq('id', rewardId)
      .select();

    if (error) {
      rewardsAdminLogger.error('Erro ao atualizar recompensa', {
        rewardId: maskId(rewardId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao atualizar recompensa' };
    }

    rewardsAdminLogger.info('Recompensa atualizada com sucesso', {
      rewardId: maskId(rewardId),
      isActive
    });
    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch (err) {
    rewardsAdminLogger.error('Erro inesperado ao toggle de recompensa', {
      rewardId: maskId(rewardId),
      error: sanitizeError(err)
    });
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
  coins_required: number;
  quantity_available?: number | null;
  type: 'digital' | 'physical';
}): Promise<ActionResponse> {
  rewardsAdminLogger.info('Iniciando criação de recompensa', {
    name: data.name,
    type: data.type,
    coinsRequired: data.coins_required
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      rewardsAdminLogger.warn('Usuário não autenticado ao criar recompensa');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      rewardsAdminLogger.warn('Usuário não autorizado ao criar recompensa', {
        userId: maskId(user.id)
      });
      return authCheck;
    }

    const supabase = await createClient();

    const insertData = {
      name: data.name,
      description: data.description || null,
      image_url: data.image_url || null,
      coins_required: data.coins_required,
      quantity_available: data.quantity_available || null,
      type: data.type,
      is_active: true,
    };

    rewardsAdminLogger.debug('Dados para inserção', { insertData });

    const { data: reward, error } = await supabase
      .from('rewards')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      rewardsAdminLogger.error('Erro ao criar recompensa no banco', {
        error: sanitizeError(error),
        errorMessage: error.message,
        errorCode: error.code
      });
      return { error: `Erro ao criar recompensa: ${error.message}` };
    }

    rewardsAdminLogger.info('Recompensa criada com sucesso', {
      rewardId: maskId(reward.id)
    });

    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true, data: reward };
  } catch (err) {
    rewardsAdminLogger.error('Erro inesperado ao criar recompensa', {
      error: sanitizeError(err)
    });
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
    description: string | null;
    coins_required: number;
    quantity_available: number | null;
    type: 'digital' | 'physical';
    image_url: string | null;
    is_active: boolean;
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

    const { error } = await supabase
      .from('rewards')
      .update({ ...data, updated_at: new Date().toISOString() })
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
  rewardsAdminLogger.info('Iniciando deleção de recompensa', {
    rewardId: maskId(rewardId)
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    rewardsAdminLogger.debug('Verificação de usuário', {
      hasUser: !!userCheck.data,
      hasError: !!userCheck.error
    });

    if (userCheck.error) {
      rewardsAdminLogger.warn('Usuário não autenticado ao tentar deletar recompensa');
      return userCheck;
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    rewardsAdminLogger.debug('Verificação de autorização', {
      userId: maskId(user.id),
      isAuthorized: !authCheck.error
    });

    if (authCheck.error) {
      rewardsAdminLogger.warn('Acesso não autorizado ao tentar deletar recompensa', {
        userId: maskId(user.id)
      });
      return authCheck;
    }

    const supabase = await createClient();

    // Verificar se existem claims ativos (pendentes, aprovados ou enviados)
    const { count: activeClaims, error: claimsError } = await supabase
      .from('reward_claims')
      .select('*', { count: 'exact', head: true })
      .eq('reward_id', rewardId)
      .in('status', ['pending', 'approved', 'shipped']);

    rewardsAdminLogger.debug('Verificação de claims ativos', {
      rewardId: maskId(rewardId),
      activeClaims: activeClaims || 0,
      hasError: !!claimsError
    });

    if (activeClaims && activeClaims > 0) {
      rewardsAdminLogger.warn('Deleção bloqueada por claims ativos', {
        rewardId: maskId(rewardId),
        activeClaims
      });
      return {
        error: `Não é possível excluir. Existem ${activeClaims} resgate(s) pendente(s)/em andamento.`
      };
    }

    // Deletar a recompensa
    rewardsAdminLogger.debug('Executando delete de recompensa');
    const { error, count } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId);

    if (error) {
      rewardsAdminLogger.error('Erro ao deletar recompensa', {
        rewardId: maskId(rewardId),
        error: sanitizeError(error)
      });
      return { error: 'Erro ao excluir recompensa' };
    }

    rewardsAdminLogger.info('Recompensa deletada com sucesso', {
      rewardId: maskId(rewardId),
      deletedCount: count
    });
    revalidatePath('/premios');
    revalidatePath('/admin/premios');
    return { success: true };
  } catch (err) {
    rewardsAdminLogger.error('Erro inesperado ao deletar recompensa', {
      rewardId: maskId(rewardId),
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Gerar thumbnail com IA para uma recompensa
 */
export async function generateRewardThumbnailAction(
  rewardId: string,
  data: {
    name: string;
    description?: string | null;
    type: 'digital' | 'physical';
    coins_required: number;
  }
): Promise<ActionResponse<{ url: string }>> {
  rewardsAdminLogger.info('Iniciando geração de thumbnail para recompensa', {
    rewardId: maskId(rewardId),
    name: data.name
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    // Gerar thumbnail
    const result = await generateRewardThumbnail({
      rewardId,
      name: data.name,
      description: data.description,
      type: data.type,
      coins_required: data.coins_required,
    });

    if (!result.success || !result.url) {
      rewardsAdminLogger.error('Falha ao gerar thumbnail', {
        rewardId: maskId(rewardId),
        error: result.error
      });
      return { error: result.error || 'Erro ao gerar imagem' };
    }

    // Atualizar a recompensa com a nova URL
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from('rewards')
      .update({ image_url: result.url })
      .eq('id', rewardId);

    if (updateError) {
      rewardsAdminLogger.error('Erro ao atualizar URL da imagem', {
        rewardId: maskId(rewardId),
        error: sanitizeError(updateError)
      });
      return { error: 'Erro ao salvar imagem na recompensa' };
    }

    rewardsAdminLogger.info('Thumbnail gerada com sucesso', {
      rewardId: maskId(rewardId)
    });

    revalidatePath('/admin/premios');
    revalidatePath('/premios');

    return { success: true, data: { url: result.url } };
  } catch (err) {
    rewardsAdminLogger.error('Erro inesperado ao gerar thumbnail', {
      rewardId: maskId(rewardId),
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}

/**
 * Upload de imagem para recompensa
 */
export async function uploadRewardImage(
  rewardId: string,
  imageData: string // Base64 encoded image
): Promise<ActionResponse<{ url: string }>> {
  rewardsAdminLogger.info('Iniciando upload de imagem para recompensa', {
    rewardId: maskId(rewardId)
  });

  try {
    // Verificar autenticação
    const userCheck = await getAuthenticatedUser();
    if (userCheck.error) {
      return { error: userCheck.error };
    }
    const user = userCheck.data!;

    // Verificar se é admin/creator
    const authCheck = await verifyAdminOrCreator(user.id);
    if (authCheck.error) {
      return { error: authCheck.error };
    }

    const supabase = await createClient();

    // Converter base64 para buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Determinar tipo de arquivo
    const mimeMatch = imageData.match(/^data:(image\/\w+);base64,/);
    const contentType = mimeMatch ? mimeMatch[1] : 'image/png';
    const extension = contentType.split('/')[1];

    const fileName = `${rewardId}.${extension}`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('reward-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      rewardsAdminLogger.error('Erro ao fazer upload de imagem', {
        rewardId: maskId(rewardId),
        error: sanitizeError(uploadError)
      });
      return { error: `Erro ao fazer upload: ${uploadError.message}` };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('reward-images')
      .getPublicUrl(fileName);

    // Adicionar timestamp para cache busting
    const urlWithTimestamp = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // Atualizar a recompensa com a nova URL
    const { error: updateError } = await supabase
      .from('rewards')
      .update({ image_url: urlWithTimestamp })
      .eq('id', rewardId);

    if (updateError) {
      rewardsAdminLogger.error('Erro ao atualizar URL da imagem', {
        rewardId: maskId(rewardId),
        error: sanitizeError(updateError)
      });
      return { error: 'Erro ao salvar imagem na recompensa' };
    }

    rewardsAdminLogger.info('Imagem enviada com sucesso', {
      rewardId: maskId(rewardId)
    });

    revalidatePath('/admin/premios');
    revalidatePath('/premios');

    return { success: true, data: { url: urlWithTimestamp } };
  } catch (err) {
    rewardsAdminLogger.error('Erro inesperado ao fazer upload de imagem', {
      rewardId: maskId(rewardId),
      error: sanitizeError(err)
    });
    return { error: 'Erro interno do servidor' };
  }
}
