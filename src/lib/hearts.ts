'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib';

const heartsLogger = logger.withContext('[Hearts]');

/**
 * Configuração de corações por ação
 * 1 ação = 1 coração (flat)
 */
export const HEARTS_CONFIG = {
  // Conteúdo
  CREATE_POST: 1,
  LIKE_POST: 1,
  COMMENT: 1,
  SHARE: 1,
  SAVE_POST: 1,
  
  // Social
  FOLLOW: 1,
  BE_FOLLOWED: 1,
  REPLY_COMMENT: 1,
  MENTION: 1,
  
  // Perfil
  COMPLETE_PROFILE: 1,
  ADD_AVATAR: 1,
  ADD_BIO: 1,
  VERIFY_EMAIL: 1,
  
  // Engajamento
  DAILY_LOGIN: 1,
  WATCH_LIVE: 1,
  VOTE_POLL: 1,
  REACT_STORY: 1,
  
  // Crescimento
  INVITE_FRIEND: 1,
  FRIEND_ACCEPTED: 1,
  FIRST_POST: 1,
  STREAK_DAY: 1,
  
  // Eventos
  JOIN_EVENT: 1,
  ATTEND_EVENT: 1,
  
  // Desafios
  JOIN_CHALLENGE: 1,
  COMPLETE_CHALLENGE: 1,
  WIN_CHALLENGE: 1,
} as const;

export type HeartAction = keyof typeof HEARTS_CONFIG;

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
