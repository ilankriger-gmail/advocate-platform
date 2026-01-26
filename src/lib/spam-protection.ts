/**
 * Sistema de proteção anti-spam com bans progressivos
 * 
 * - 1ª violação: 24h de ban
 * - 2ª violação: 48h de ban
 * - 3ª violação: 72h de ban
 * - 4ª violação: 1 semana de ban
 * - 5ª violação: 2 semanas de ban
 * - 6ª+ violação: 1 mês de ban
 */

import { createAdminClient } from '@/lib/supabase/admin';

export type BanType = 'comment' | 'like' | 'post' | 'full';
export type ViolationType = 'comment_spam' | 'comment_duplicate' | 'like_spam' | 'post_spam';

interface BanStatus {
  banned: boolean;
  ban_type?: BanType;
  reason?: string;
  expires_at?: string;
  remaining_hours?: number;
}

interface BanResult {
  banned: boolean;
  ban_type: BanType;
  expires_at: string;
  duration_hours: number;
}

/**
 * Verifica se o usuário está banido de uma ação específica
 */
export async function checkUserBan(userId: string, banType: BanType): Promise<BanStatus> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase.rpc('check_user_ban', {
      p_user_id: userId,
      p_ban_type: banType,
    });
    
    if (error) {
      console.error('Erro ao verificar ban:', error);
      // Em caso de erro, permite a ação (fail-open)
      return { banned: false };
    }
    
    return data as BanStatus;
  } catch (error) {
    console.error('Erro ao verificar ban:', error);
    return { banned: false };
  }
}

/**
 * Registra uma violação de spam e aplica ban progressivo
 */
export async function recordSpamViolation(
  userId: string,
  violationType: ViolationType,
  details: Record<string, unknown> = {}
): Promise<BanResult | null> {
  try {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase.rpc('record_spam_violation', {
      p_user_id: userId,
      p_violation_type: violationType,
      p_details: details,
    });
    
    if (error) {
      console.error('Erro ao registrar violação:', error);
      return null;
    }
    
    return data as BanResult;
  } catch (error) {
    console.error('Erro ao registrar violação:', error);
    return null;
  }
}

/**
 * Formata mensagem de ban para o usuário
 */
export function formatBanMessage(banStatus: BanStatus): string {
  if (!banStatus.banned) return '';
  
  const hours = Math.ceil(banStatus.remaining_hours || 0);
  
  if (hours < 1) {
    return 'Você está temporariamente bloqueado. Tente novamente em alguns minutos.';
  } else if (hours < 24) {
    return `Você está bloqueado por mais ${hours} hora${hours > 1 ? 's' : ''} devido a spam.`;
  } else {
    const days = Math.ceil(hours / 24);
    return `Você está bloqueado por mais ${days} dia${days > 1 ? 's' : ''} devido a spam.`;
  }
}

/**
 * Verifica ban e retorna erro formatado se banido
 */
export async function checkBanOrError(
  userId: string,
  banType: BanType
): Promise<{ error: string } | null> {
  const banStatus = await checkUserBan(userId, banType);
  
  if (banStatus.banned) {
    return { error: formatBanMessage(banStatus) };
  }
  
  return null;
}
