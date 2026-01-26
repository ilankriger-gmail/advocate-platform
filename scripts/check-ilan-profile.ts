import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsxanzgwstlpfvnqcmiu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function checkProfile() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, avatar_url, email, role')
    .ilike('email', '%ilan%')
    .single();

  if (error) {
    console.error('Erro:', error);
    return;
  }

  console.log('Perfil do Ilan:');
  console.log('- ID:', data.id);
  console.log('- Nome:', data.full_name || '(vazio)');
  console.log('- Avatar:', data.avatar_url || '(vazio)');
  console.log('- Email:', data.email);
  console.log('- Role:', data.role);
}

checkProfile();
