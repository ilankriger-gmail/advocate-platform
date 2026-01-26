import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function find() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, content, media_url, created_at, user_id, users!posts_user_id_fkey(full_name)')
    .eq('status', 'approved')
    .ilike('users.full_name', '%Regiane%')
    .order('created_at', { ascending: false });

  if (!data) {
    console.log('Nenhum post encontrado');
    return;
  }
  
  console.log(`Encontrados ${data.length} posts:\n`);
  data.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p.id}`);
    console.log(`   Título: ${p.title?.slice(0, 50) || '(sem título)'}`);
    console.log(`   Imagens: ${p.media_url?.length || 0}`);
    console.log(`   Criado: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
    console.log();
  });
}
find();
