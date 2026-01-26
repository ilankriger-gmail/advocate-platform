import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { filterSimilarPosts, calculateSimilarity } from '../src/lib/similarity';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data) return;
  
  console.log('=== ANTES DO FILTRO ===');
  console.log(`Total: ${data.length} posts\n`);
  data.slice(0, 10).forEach((p, i) => {
    console.log(`${i+1}. ${p.title?.slice(0, 50)}...`);
  });
  
  const filtered = filterSimilarPosts(data as any, 0.6);
  
  console.log('\n=== DEPOIS DO FILTRO ===');
  console.log(`Total: ${filtered.length} posts (removidos: ${data.length - filtered.length})\n`);
  filtered.slice(0, 10).forEach((p, i) => {
    console.log(`${i+1}. ${p.title?.slice(0, 50)}...`);
  });

  // Verificar os posts similares
  const similar = data.filter(p => p.title?.includes('EU TE AMO DO NEXT'));
  if (similar.length > 1) {
    console.log('\n=== POSTS PROBLEMÁTICOS ===');
    similar.forEach(p => {
      console.log(`- ID: ${p.id}`);
      console.log(`  Título: ${p.title}`);
      console.log(`  Criado: ${p.created_at}\n`);
    });
    
    const score = calculateSimilarity(
      `${similar[0].title} ${similar[0].content}`,
      `${similar[1].title} ${similar[1].content}`
    );
    console.log(`Similaridade calculada: ${(score * 100).toFixed(0)}%`);
    console.log(`Deveria filtrar: ${score >= 0.6 ? 'SIM' : 'NÃO'}`);
  }
}
check();
