import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteDupe() {
  const dupeId = '2641985f-23bc-4ef0-bb4d-4a359d276dec';
  
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', dupeId);

  if (error) {
    console.log('Erro ao deletar:', error.message);
  } else {
    console.log('✅ Post duplicado deletado:', dupeId);
  }
}
deleteDupe();
