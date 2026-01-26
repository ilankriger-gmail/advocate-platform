import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsxanzgwstlpfvnqcmiu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function resetIlanCoins() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Buscar Ilan pelo email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, full_name, email')
    .ilike('email', '%ilan%')
    .single();

  if (userError || !user) {
    console.log('Usuário não encontrado');
    return;
  }

  console.log('Usuário encontrado:', user.full_name, user.email);

  // Verificar saldo atual
  const { data: coins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  console.log('Saldo atual:', coins?.balance || 0);

  // Zerar saldo
  const { error: updateError } = await supabase
    .from('user_coins')
    .update({ balance: 0 })
    .eq('user_id', user.id);

  if (updateError) {
    console.error('Erro ao zerar:', updateError);
    return;
  }

  console.log('✅ Corações zerados com sucesso!');
}

resetIlanCoins();
