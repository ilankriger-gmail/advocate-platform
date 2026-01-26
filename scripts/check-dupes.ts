import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at, user_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(50);

  if (!data) return;

  // Agrupar por título
  const byTitle = new Map<string, typeof data>();
  for (const post of data) {
    const key = post.title?.toLowerCase().trim() || '';
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(post);
  }

  console.log('=== POSTS COM TÍTULO DUPLICADO ===\n');
  let foundDupes = false;
  for (const [title, posts] of byTitle) {
    if (posts.length > 1) {
      foundDupes = true;
      console.log(`"${title.slice(0, 50)}..." - ${posts.length}x`);
      posts.forEach(p => console.log(`  - ${p.id.slice(0, 8)} (${new Date(p.created_at).toLocaleString()})`));
      console.log();
    }
  }
  
  if (!foundDupes) {
    console.log('Nenhum título duplicado encontrado nos últimos 50 posts.');
  }
}
check();
