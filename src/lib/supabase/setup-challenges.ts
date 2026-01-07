import { createClient } from '@/lib/supabase/server';

export async function setupChallengesTables() {
  const supabase = await createClient();

  // Verifica se a tabela já existe
  const { data: existing } = await supabase
    .from('challenges')
    .select('id')
    .limit(1);

  // Se já existe, não faz nada
  if (existing !== null) {
    return { success: true, message: 'Tabelas já existem' };
  }

  // Se não existe, cria via RPC ou retorna erro amigável
  return { success: false, message: 'Execute o SQL inicial no Supabase' };
}
