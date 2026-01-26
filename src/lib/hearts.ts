'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib';
import { HEARTS_CONFIG, type HeartAction } from './hearts-config';

const heartsLogger = logger.withContext('[Hearts]');

// 🛡️ Configuração anti-spam: máximo de ações por período
const SPAM_LIMITS: Partial<Record<HeartAction, { maxPerHour: number; maxPerDay: number }>> = {
  COMMENT: { maxPerHour: 10, maxPerDay: 30 },
  REPLY_COMMENT: { maxPerHour: 15, maxPerDay: 50 },
  LIKE_POST: { maxPerHour: 30, maxPerDay: 100 },
  CREATE_POST: { maxPerHour: 3, maxPerDay: 10 },
};

/**
 * Verificar se usuário está fazendo spam de ações
 */
async function checkSpamLimit(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  action: HeartAction
): Promise<{ blocked: boolean; reason?: string }> {
  const limit = SPAM_LIMITS[action];
  
  if (!limit) {
    return { blocked: false };
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Contar ações na última hora
  const { count: hourCount } = await supabase
    .from('coin_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('reference_type', action.toLowerCase())
    .gte('created_at', oneHourAgo.toISOString());

  if ((hourCount || 0) >= limit.maxPerHour) {
    heartsLogger.warn('Spam detectado (hora)', { userId, action, count: hourCount });
    return { 
      blocked: true, 
      reason: `Você atingiu o limite de ${limit.maxPerHour} ${action.toLowerCase()} por hora` 
    };
  }

  // Contar ações nas últimas 24h
  const { count: dayCount } = await supabase
    .from('coin_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('reference_type', action.toLowerCase())
    .gte('created_at', oneDayAgo.toISOString());

  if ((dayCount || 0) >= limit.maxPerDay) {
    heartsLogger.warn('Spam detectado (dia)', { userId, action, count: dayCount });
    return { 
      blocked: true, 
      reason: `Você atingiu o limite de ${limit.maxPerDay} ${action.toLowerCase()} por dia` 
    };
  }

  return { blocked: false };
}

/**
 * Dar corações para um usuário por uma ação
 */
export async function giveHearts(
  userId: string,
  action: HeartAction,
  metadata?: {
    referenceId?: string;
    referenceType?: string;
    description?: string;
  }
): Promise<{ success: boolean; hearts: number; error?: string }> {
  const hearts = HEARTS_CONFIG[action];
  
  if (!hearts || hearts <= 0) {
    return { success: true, hearts: 0 };
  }

  try {
    const supabase = await createClient();

    // 🛡️ Anti-spam: verificar limite de ações
    const spamCheck = await checkSpamLimit(supabase, userId, action);
    if (spamCheck.blocked) {
      heartsLogger.warn('Ação bloqueada por spam', { userId, action, reason: spamCheck.reason });
      // Silenciosamente não dar corações (não mostra erro ao usuário)
      return { success: true, hearts: 0 };
    }
    
    // Descrição da transação
    const description = metadata?.description || `${action.replace(/_/g, ' ').toLowerCase()}`;
    
    // Tentar usar RPC primeiro
    const { error: rpcError } = await supabase.rpc('add_user_coins', {
      p_user_id: userId,
      p_amount: hearts,
      p_type: 'earned',
      p_description: `❤️ ${description}`
    });

    if (rpcError) {
      // Fallback: atualizar manualmente
      heartsLogger.warn('RPC falhou, usando fallback', { error: rpcError.message });
      
      // Verificar se usuário tem registro de coins
      const { data: userCoins } = await supabase
        .from('user_coins')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (userCoins) {
        // Atualizar saldo existente
        await supabase
          .from('user_coins')
          .update({ balance: userCoins.balance + hearts })
          .eq('user_id', userId);
      } else {
        // Criar novo registro
        await supabase
          .from('user_coins')
          .insert({ user_id: userId, balance: hearts });
      }

      // Registrar transação
      await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: hearts,
          type: 'earned',
          description: `❤️ ${description}`,
          reference_id: metadata?.referenceId || null,
          reference_type: metadata?.referenceType || action.toLowerCase(),
        });
    }

    heartsLogger.debug('Corações dados', { userId, action, hearts });
    
    return { success: true, hearts };
  } catch (error) {
    heartsLogger.error('Erro ao dar corações', { userId, action, error });
    return { success: false, hearts: 0, error: 'Erro ao processar corações' };
  }
}

/**
 * Obter saldo de corações do usuário
 */
export async function getHeartsBalance(userId: string): Promise<number> {
  try {
    const supabase = await createClient();
    
    const { data } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .single();
    
    return data?.balance || 0;
  } catch {
    return 0;
  }
}
