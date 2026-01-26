import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Buscar os mesmos posts que a home busca
  const { data } = await supabase
    .from('posts')
    .select('id, title, user_id, media_url, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data) return;

  console.log('=== POSTS NA HOME (últimos 20) ===\n');
  
  // Verificar imagens duplicadas
  const imageMap = new Map<string, string[]>();
  
  for (const post of data) {
    console.log(`- ${post.title?.slice(0, 40)}...`);
    if (post.media_url?.length) {
      console.log(`  📷 ${post.media_url.length} imagem(ns)`);
      for (const url of post.media_url) {
        const existing = imageMap.get(url) || [];
        existing.push(post.id);
        imageMap.set(url, existing);
      }
    }
  }
  
  console.log('\n=== IMAGENS DUPLICADAS ===\n');
  let foundDupes = false;
  for (const [url, postIds] of imageMap) {
    if (postIds.length > 1) {
      foundDupes = true;
      console.log(`🔴 Mesma imagem em ${postIds.length} posts:`);
      console.log(`   URL: ${url.slice(0, 60)}...`);
      console.log(`   Posts: ${postIds.join(', ')}`);
    }
  }
  
  if (!foundDupes) {
    console.log('Nenhuma imagem duplicada encontrada.');
  }
}
check();
