'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

// Verificar estado do banco de dados
export async function checkDatabaseSchema() {
  const supabase = createAdminClient();

  const checks = {
    challenges_raffle_fields: false,
    participants_ai_verdict: false,
    challenge_raffles_table: false,
  };

  // Verificar campos de sorteio na tabela challenges
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('raffle_enabled')
      .limit(1);

    if (!error) {
      checks.challenges_raffle_fields = true;
    }
  } catch {
    // Campo nao existe
  }

  // Verificar campo ai_verdict na tabela challenge_participants
  try {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('ai_verdict')
      .limit(1);

    if (!error) {
      checks.participants_ai_verdict = true;
    }
  } catch {
    // Campo nao existe
  }

  // Verificar tabela challenge_raffles
  try {
    const { data, error } = await supabase
      .from('challenge_raffles')
      .select('id')
      .limit(1);

    if (!error) {
      checks.challenge_raffles_table = true;
    }
  } catch {
    // Tabela nao existe
  }

  return checks;
}

// Buscar participacoes pendentes para aprovacao
export async function getPendingParticipations() {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges(title, goal_type, goal_value, coins_reward),
      users(email, full_name, instagram_username)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

// Aprovar participacao
export async function approveParticipation(participationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nao autorizado' };
  }

  // Verificar se e admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { error: 'Apenas admins podem aprovar' };
  }

  const adminSupabase = createAdminClient();

  // Buscar participacao
  const { data: participation, error: fetchError } = await adminSupabase
    .from('challenge_participants')
    .select('*, challenges(coins_reward)')
    .eq('id', participationId)
    .single();

  if (fetchError || !participation) {
    return { error: 'Participacao nao encontrada' };
  }

  const coinsReward = participation.challenges?.coins_reward || 0;

  // Atualizar status para aprovado
  const { error: updateError } = await adminSupabase
    .from('challenge_participants')
    .update({
      status: 'approved',
      coins_earned: coinsReward,
      is_raffle_eligible: true,
    })
    .eq('id', participationId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Adicionar moedas ao usuario
  const { error: coinsError } = await adminSupabase.rpc('add_user_coins', {
    p_user_id: participation.user_id,
    p_amount: coinsReward,
  });

  // Se a funcao RPC nao existe, tenta upsert direto
  if (coinsError) {
    const { data: existingCoins } = await adminSupabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', participation.user_id)
      .single();

    const newBalance = (existingCoins?.balance || 0) + coinsReward;

    await adminSupabase
      .from('user_coins')
      .upsert({
        user_id: participation.user_id,
        balance: newBalance,
      });
  }

  return { success: true, coinsEarned: coinsReward };
}

// Rejeitar participacao
export async function rejectParticipation(participationId: string, reason?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nao autorizado' };
  }

  // Verificar se e admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    return { error: 'Apenas admins podem rejeitar' };
  }

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('challenge_participants')
    .update({
      status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', participationId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// Realizar sorteio para um desafio
export async function runRaffle(challengeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nao autorizado' };
  }

  const adminSupabase = createAdminClient();

  // Buscar desafio
  const { data: challenge, error: challengeError } = await adminSupabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (challengeError || !challenge) {
    return { error: 'Desafio nao encontrado' };
  }

  // Buscar participantes elegiveis (aprovados e nao sorteados ainda)
  const { data: eligibleParticipants, error: participantsError } = await adminSupabase
    .from('challenge_participants')
    .select('user_id')
    .eq('challenge_id', challengeId)
    .eq('status', 'approved')
    .eq('is_raffle_eligible', true);

  if (participantsError || !eligibleParticipants?.length) {
    return { error: 'Nenhum participante elegivel' };
  }

  // Sortear ganhadores
  const numWinners = challenge.raffle_num_winners || 1;
  const prizeAmount = challenge.raffle_prize_amount || 0;
  const shuffled = eligibleParticipants.sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, numWinners);

  // Registrar ganhadores
  for (const winner of winners) {
    await adminSupabase.from('challenge_raffles').insert({
      challenge_id: challengeId,
      winner_user_id: winner.user_id,
      prize_amount: prizeAmount / numWinners,
    });

    // Marcar como nao elegivel (ja ganhou)
    await adminSupabase
      .from('challenge_participants')
      .update({ is_raffle_eligible: false })
      .eq('challenge_id', challengeId)
      .eq('user_id', winner.user_id);
  }

  return { success: true, winners: winners.length };
}
