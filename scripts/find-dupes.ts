import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Buscar os posts problemáticos
  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at, user_id')
    .eq('status', 'approved')
    .ilike('title', '%EU TE AMO DO NEXT%')
    .order('created_at', { ascending: false });

  if (!data || data.length === 0) {
    console.log('Posts não encontrados');
    return;
  }
  
  console.log(`Encontrados ${data.length} posts similares:\n`);
  data.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p.id}`);
    console.log(`   Título: ${p.title?.slice(0, 60)}...`);
    console.log(`   Criado: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
    console.log(`   User: ${p.user_id.slice(0, 8)}...\n`);
  });

  if (data.length > 1) {
    console.log('🔴 AÇÃO: Deletar o mais recente (manter o original)\n');
    console.log('Post a DELETAR:', data[0].id);
    console.log('Post a MANTER:', data[1].id);
  }
}
check();
