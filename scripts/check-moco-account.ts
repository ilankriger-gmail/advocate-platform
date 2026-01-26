import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsxanzgwstlpfvnqcmiu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function check() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Buscar conta do Moço
  const { data: moco } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .or('full_name.ilike.%moço%,email.ilike.%moco%')
    .limit(5);

  console.log('Contas encontradas com "moço" ou "moco":');
  console.log(moco);

  // Verificar tabela de autoresponses
  const { data: autoresponses, error } = await supabase
    .from('scheduled_autoresponses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('\nErro ao buscar autoresponses:', error.message);
  } else {
    console.log('\nÚltimas 10 autoresponses:');
    console.log(autoresponses?.length || 0, 'registros');
    autoresponses?.forEach(r => {
      console.log(`- ${r.status}: "${r.response_text?.substring(0, 40)}..." (scheduled: ${r.scheduled_for})`);
    });
  }
}

check();
