import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { calculateSimilarity } from '../src/lib/similarity';
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
    .limit(30);

  if (!data) return;

  console.log('=== POSTS SIMILARES (threshold 60%) ===\n');
  
  const similar: Array<{p1: string, p2: string, score: number}> = [];
  
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      const text1 = `${data[i].title || ''} ${data[i].content || ''}`;
      const text2 = `${data[j].title || ''} ${data[j].content || ''}`;
      const score = calculateSimilarity(text1, text2);
      
      if (score >= 0.4) { // Mostrar até 40%+ para debug
        similar.push({
          p1: data[i].title?.slice(0, 40) || 'sem título',
          p2: data[j].title?.slice(0, 40) || 'sem título',
          score
        });
      }
    }
  }
  
  similar.sort((a, b) => b.score - a.score);
  
  if (similar.length === 0) {
    console.log('Nenhum par com >40% de similaridade.');
  } else {
    similar.forEach(s => {
      const pct = (s.score * 100).toFixed(0);
      const emoji = s.score >= 0.6 ? '🔴' : '🟡';
      console.log(`${emoji} ${pct}%: "${s.p1}..." vs "${s.p2}..."`);
    });
  }
}
check();
