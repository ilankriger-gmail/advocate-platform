import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
  
  // Simular exatamente o que o AuthContext faz
  const supabase = createClient(supabaseUrl, anonKey);
  
  const userId = 'f6001534-96d1-496a-9953-ff7f3946a611';
  
  console.log('=== Simulando AuthContext.fetchProfile() ===');
  console.log('User ID:', userId);
  
  const { data, error } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', userId)
    .single();
    
  console.log('Profile data:', data);
  console.log('Error:', error);
  
  if (data) {
    console.log('\n=== Logica do Header/Sidebar ===');
    const showAdminLink = data.role === 'admin' || data.is_creator === true;
    console.log(`profile.role = '${data.role}'`);
    console.log(`profile.is_creator = ${data.is_creator}`);
    console.log(`showAdminLink = ${showAdminLink}`);
  }
}

main();
