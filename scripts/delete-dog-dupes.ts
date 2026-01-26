import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteDupes() {
  const dupeIds = [
    '408c9546-a2b0-4e38-8dba-55ec0c303f4b', // Bora bora com o Pimenta
    'c532c536-8721-46a9-ac19-6d79a5837848', // Fofuras
    '0a6e3e63-a9ac-4236-93bb-052c60e7679e', // Bora bora vem pra bc
  ];
  
  for (const id of dupeIds) {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) {
      console.log(`❌ Erro ao deletar ${id}: ${error.message}`);
    } else {
      console.log(`✅ Deletado: ${id}`);
    }
  }
  
  console.log('\nPronto! Mantido apenas "meus amores"');
}
deleteDupes();
