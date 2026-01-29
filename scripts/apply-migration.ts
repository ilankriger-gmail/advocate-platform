// Run with: npx tsx scripts/apply-migration.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gsxanzgwstlpfvnqcmiu.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { error } = await supabase.rpc('exec', {
    query: 'ALTER TABLE challenge_winners ADD COLUMN IF NOT EXISTS winner_message TEXT DEFAULT NULL'
  });
  
  if (error) {
    // Try direct approach via raw SQL
    console.log('RPC failed, trying pg_net...');
    const { data, error: error2 } = await supabase
      .from('challenge_winners')
      .select('id')
      .limit(1);
    console.log('Table accessible:', !error2);
    console.log('Note: Run this SQL in Supabase Dashboard:');
    console.log('ALTER TABLE challenge_winners ADD COLUMN IF NOT EXISTS winner_message TEXT DEFAULT NULL;');
  } else {
    console.log('Migration applied!');
  }
}

run();
