'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { giveHearts } from '@/lib/hearts';
import { revalidatePath } from 'next/cache';

// Recompensas — apenas primeira geração (indicador + indicado)
const REWARDS = {
  DIRECT_REFERRER: 100,  // Quem indicou
  DIRECT_REFERRED: 100,  // Quem foi indicado
};

function getRewardByGeneration(generation: number): number {
  switch (generation) {
    case 1: return REWARDS.DIRECT_REFERRER;
    default: return 0; // Sem cascata — apenas 1ª geração
  }
}

/**
 * Buscar código de indicação do usuário atual
 */
export async function getMyReferralCode(): Promise<{
  code: string | null;
  totalReferred: number;
  totalEarned: number;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { code: null, totalReferred: 0, totalEarned: 0 };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  // Contar indicações
  const { count: totalReferred } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'completed');

  // Somar recompensas ganhas
  const { data: rewards } = await supabase
    .from('referral_rewards_log')
    .select('reward_amount')
    .eq('user_id', user.id);

  const totalEarned = rewards?.reduce((sum, r) => sum + r.reward_amount, 0) || 0;

  return {
    code: profile?.referral_code || null,
    totalReferred: totalReferred || 0,
    totalEarned,
  };
}

/**
 * Buscar informações de um código de indicação
 */
export async function getReferralInfo(code: string): Promise<{
  valid: boolean;
  referrerName?: string;
}> {
  const supabase = createAdminClient();

  const { data: referrer } = await supabase
    .from('users')
    .select('full_name')
    .eq('referral_code', code.toUpperCase())
    .single();

  return {
    valid: !!referrer,
    referrerName: referrer?.full_name || undefined,
  };
}

/**
 * Registrar indicação quando usuário se cadastra
 * Chamado durante o registro
 */
export async function registerReferral(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Buscar quem indicou
  const { data: referrer, error: referrerError } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('referral_code', referralCode.toUpperCase())
    .single();

  if (referrerError || !referrer) {
    return { success: false, error: 'Código de indicação inválido' };
  }

  // Não pode indicar a si mesmo
  if (referrer.id === newUserId) {
    return { success: false, error: 'Você não pode usar seu próprio código' };
  }

  // Atualizar usuário com referred_by
  const { error: updateError } = await supabase
    .from('users')
    .update({ referred_by: referrer.id })
    .eq('id', newUserId);

  if (updateError) {
    console.error('[Referral] Erro ao atualizar referred_by:', updateError);
    return { success: false, error: 'Erro ao registrar indicação' };
  }

  // Criar registro de indicação
  const { data: referral, error: referralError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referred_id: newUserId,
      referral_code: referralCode.toUpperCase(),
      status: 'pending',
    })
    .select()
    .single();

  if (referralError) {
    console.error('[Referral] Erro ao criar referral:', referralError);
    // Não falhar por causa disso, o referred_by já foi setado
  }

  console.log(`[Referral] Indicação registrada: ${referrer.full_name} → novo usuário`);
  
  return { success: true };
}

/**
 * Completar indicação e pagar recompensas
 * Chamado quando o usuário indicado completa alguma ação (ex: primeiro post, primeiro desafio)
 */
export async function completeReferral(
  userId: string
): Promise<{ success: boolean; rewards: Array<{ userId: string; amount: number; generation: number }> }> {
  const supabase = createAdminClient();
  const rewards: Array<{ userId: string; amount: number; generation: number }> = [];

  // Buscar referral pendente
  const { data: referral } = await supabase
    .from('referrals')
    .select('*, referrer:referrer_id(id, full_name)')
    .eq('referred_id', userId)
    .eq('status', 'pending')
    .single();

  if (!referral) {
    // Não tem indicação pendente
    return { success: true, rewards: [] };
  }

  // Marcar como completa
  await supabase
    .from('referrals')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  // Pagar recompensa para quem foi indicado (100 corações)
  await giveHearts(userId, 'FRIEND_ACCEPTED', {
    referenceId: referral.id,
    referenceType: 'referral',
    description: 'bônus por ser indicado'
  });

  // Dar 100 corações diretamente (além do coração da ação)
  await supabase.rpc('add_user_coins', {
    p_user_id: userId,
    p_amount: REWARDS.DIRECT_REFERRED - 1, // -1 porque giveHearts já deu 1
    p_type: 'bonus',
    p_description: '🎁 Bônus de boas-vindas por indicação!'
  });

  rewards.push({ userId, amount: REWARDS.DIRECT_REFERRED, generation: 0 });

  // Pagar recompensa para quem indicou (100 corações)
  const referrerId = (referral.referrer as { id: string })?.id;
  if (referrerId) {
    await giveHearts(referrerId, 'INVITE_FRIEND', {
      referenceId: referral.id,
      referenceType: 'referral',
      description: 'indicou um amigo'
    });

    await supabase.rpc('add_user_coins', {
      p_user_id: referrerId,
      p_amount: REWARDS.DIRECT_REFERRER - 1,
      p_type: 'bonus',
      p_description: '🎁 Bônus por indicar um amigo!'
    });

    rewards.push({ userId: referrerId, amount: REWARDS.DIRECT_REFERRER, generation: 1 });

    // Log
    await supabase.from('referral_rewards_log').insert({
      referral_id: referral.id,
      user_id: referrerId,
      new_user_id: userId,
      generation: 1,
      reward_amount: REWARDS.DIRECT_REFERRER,
    });
  }

  // Cascata desativada — apenas 1ª geração (indicador direto)

  console.log(`[Referral] Indicação completa! Recompensas pagas:`, rewards);

  return { success: true, rewards };
}

/**
 * Buscar minhas indicações
 */
export async function getMyReferrals(): Promise<{
  referrals: Array<{
    id: string;
    referredName: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
  }>;
}> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { referrals: [] };
  }

  const { data } = await supabase
    .from('referrals')
    .select(`
      id,
      status,
      created_at,
      completed_at,
      referred:referred_id(full_name)
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const referrals = (data || []).map(r => {
    const referred = r.referred as { full_name: string } | { full_name: string }[] | null;
    const referredName = Array.isArray(referred) 
      ? referred[0]?.full_name 
      : referred?.full_name;
    return {
      id: r.id,
      referredName: referredName || 'Usuário',
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
    };
  });

  return { referrals };
}

/**
 * Gerar link de indicação
 */
export async function getReferralLink(): Promise<string | null> {
  const { code } = await getMyReferralCode();
  if (!code) return null;
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://comunidade.omocodoteamo.com.br';
  return `${baseUrl}/convite?ref=${code}`;
}
