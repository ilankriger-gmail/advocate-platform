import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateSimilarity } from '../src/lib/similarity';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findDupes() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at, user_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100);

  if (!data) return;
  
  const dupes: string[] = [];
  
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      // Mesmo usuário?
      if (data[i].user_id !== data[j].user_id) continue;
      
      const text1 = `${data[i].title || ''} ${data[i].content || ''}`;
      const text2 = `${data[j].title || ''} ${data[j].content || ''}`;
      const score = calculateSimilarity(text1, text2);
      
      if (score >= 0.5) {
        console.log(`\n🔴 ${(score * 100).toFixed(0)}% similar:`);
        console.log(`  1. ${data[i].title?.slice(0, 50)}... (${data[i].id.slice(0,8)})`);
        console.log(`  2. ${data[j].title?.slice(0, 50)}... (${data[j].id.slice(0,8)})`);
        // Marcar o mais novo pra deletar
        dupes.push(data[i].id);
      }
    }
  }
  
  if (dupes.length === 0) {
    console.log('✅ Nenhum duplicado encontrado!');
  } else {
    console.log(`\n\nTotal de duplicados a remover: ${dupes.length}`);
    console.log('IDs:', dupes);
  }
}
findDupes();
