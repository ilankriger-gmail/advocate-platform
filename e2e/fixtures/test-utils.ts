import { createClient } from '@supabase/supabase-js';

/**
 * Utilitários para testes E2E
 *
 * Usa Supabase Admin (service_role) para operações de teste
 */

// Cliente Supabase Admin para operações de teste
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gera um email único para testes
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `teste-e2e-${timestamp}-${random}@teste.com`;
}

/**
 * Aprova um lead diretamente no banco de dados
 * Simula a ação de um admin aprovando o lead
 */
export async function approveLeadDirectly(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('nps_leads')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase());

  if (error) {
    throw new Error(`Erro ao aprovar lead: ${error.message}`);
  }

  console.log(`Lead aprovado: ${email}`);
}

/**
 * Limpa todos os dados de teste do banco
 * Remove lead e usuário criados durante o teste
 */
export async function cleanupTestData(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const normalizedEmail = email.toLowerCase();

  console.log(`Limpando dados de teste para: ${normalizedEmail}`);

  // 1. Deletar lead da tabela nps_leads
  const { error: leadError } = await supabase
    .from('nps_leads')
    .delete()
    .eq('email', normalizedEmail);

  if (leadError) {
    console.warn(`Aviso ao deletar lead: ${leadError.message}`);
  } else {
    console.log('Lead deletado');
  }

  // 2. Buscar usuário pelo email
  const { data: users, error: userQueryError } = await supabase
    .from('users')
    .select('id')
    .eq('email', normalizedEmail);

  if (userQueryError) {
    console.warn(`Aviso ao buscar usuário: ${userQueryError.message}`);
    return;
  }

  if (users && users.length > 0) {
    const userId = users[0].id;

    // 3. Deletar usuário da tabela users (RLS bypass com service_role)
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteUserError) {
      console.warn(`Aviso ao deletar usuário: ${deleteUserError.message}`);
    } else {
      console.log('Usuário deletado');
    }

    // 4. Deletar usuário do auth.users (requer admin API)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.warn(`Aviso ao deletar auth user: ${authDeleteError.message}`);
    } else {
      console.log('Auth user deletado');
    }
  }

  console.log('Limpeza concluída');
}

/**
 * Verifica se um lead existe no banco
 */
export async function checkLeadExists(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('nps_leads')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    return false;
  }

  return !!data;
}

/**
 * Obtém o status de um lead
 */
export async function getLeadStatus(email: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('nps_leads')
    .select('status')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    return null;
  }

  return data?.status || null;
}
