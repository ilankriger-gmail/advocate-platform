'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib';
import { HEARTS_CONFIG, type HeartAction } from './hearts-config';

const heartsLogger = logger.withContext('[Hearts]');

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
