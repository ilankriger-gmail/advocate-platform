/**
 * Script para configurar is_creator = true para o email especificado
 * Uso: npx tsx scripts/set-creator.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carregar .env.local manualmente
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

const CREATOR_EMAIL = 'ilankriger@gmail.com';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Erro: Variaveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorias');
    process.exit(1);
  }

  // Usar service role para bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Buscando usuario com email: ${CREATOR_EMAIL}...`);

  // Primeiro, buscar o usuario pelo email na tabela auth.users
  const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Erro ao buscar usuarios:', authError);
    process.exit(1);
  }

  const user = authUser.users.find(u => u.email === CREATOR_EMAIL);

  if (!user) {
    console.error(`Usuario com email ${CREATOR_EMAIL} nao encontrado`);
    console.log('Usuarios encontrados:', authUser.users.map(u => u.email));
    process.exit(1);
  }

  console.log(`Usuario encontrado: ${user.id}`);

  // Tentar tabela users (nome real) ao invés de profiles (alias)
  console.log('Tentando atualizar tabela users...');
  let { data, error } = await supabase
    .from('users')
    .update({ is_creator: true })
    .eq('id', user.id)
    .select();

  // Se falhar com users, tentar profiles
  if (error && error.code === 'PGRST204') {
    console.log('Tabela users nao tem is_creator, tentando profiles...');
    const result = await supabase
      .from('profiles')
      .update({ is_creator: true })
      .eq('id', user.id)
      .select();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    process.exit(1);
  }

  console.log('Perfil atualizado com sucesso:', data);
}

main();
