import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteDupe() {
  const dupeId = '2df0f06c-c94f-41f1-8d0e-6187167dc105';
  
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
