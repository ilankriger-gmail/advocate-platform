import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Verificar respostas agendadas pendentes
  const { data: pending, error: e1 } = await supabase
    .from('scheduled_autoresponses')
    .select('*')
    .eq('status', 'pending');
    
  console.log('📬 Respostas PENDENTES:', pending?.length || 0);
  
  // Verificar últimas respostas enviadas
  const { data: sent, error: e2 } = await supabase
    .from('scheduled_autoresponses')
    .select('*')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(5);
    
  console.log('✅ Últimas ENVIADAS:', sent?.length || 0);
  if (sent?.length) {
    sent.forEach(s => {
      console.log('   -', new Date(s.sent_at).toLocaleString('pt-BR'));
    });
  }
  
  // Verificar últimos comentários (pra ver se o auto-responder tá sendo acionado)
  const { data: comments } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('\n💬 Últimos COMENTÁRIOS:');
  comments?.forEach(c => {
    console.log('   -', new Date(c.created_at).toLocaleString('pt-BR'), c.content?.slice(0,40) + '...');
  });
}
check();
