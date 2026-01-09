import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carregar .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !line.startsWith('#')) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log('=== Teste com ANON KEY (como o browser faz) ===');
  const anonClient = createClient(supabaseUrl, anonKey);
  
  const { data: anonData, error: anonError } = await anonClient
    .from('users')
    .select('id, email, role, is_creator')
    .eq('email', 'ilankriger@gmail.com')
    .single();
    
  console.log('Anon Result:', anonData);
  console.log('Anon Error:', anonError);

  console.log('\n=== Teste com SERVICE KEY (bypass RLS) ===');
  const serviceClient = createClient(supabaseUrl, serviceKey);
  
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('users')
    .select('id, email, role, is_creator')
    .eq('email', 'ilankriger@gmail.com')
    .single();
    
  console.log('Service Result:', serviceData);
  console.log('Service Error:', serviceError);
}

main();
