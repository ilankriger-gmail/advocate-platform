'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * Exportar usuários com telefone em formato CSV
 */
export async function exportUsersWithPhone(): Promise<{ csv?: string; error?: string }> {
  try {
    // Verificar se é admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') return { error: 'Sem permissão' };

    // Buscar todos os usuários
    const adminClient = createAdminClient();
    const { data: users, error } = await adminClient
      .from('users')
      .select('full_name, email, phone, instagram_username, created_at, onboarding_completed')
      .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    if (!users || users.length === 0) return { error: 'Nenhum usuário encontrado' };

    // Gerar CSV
    const header = 'Nome,Email,Telefone,Instagram,Data Cadastro,Onboarding Completo';
    const rows = users.map(u => {
      const name = (u.full_name || '').replace(/,/g, ' ');
      const email = u.email || '';
      const phone = u.phone || '';
      const instagram = u.instagram_username || '';
      const date = u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
      const onboarding = u.onboarding_completed ? 'Sim' : 'Não';
      return `${name},${email},${phone},${instagram},${date},${onboarding}`;
    });

    const csv = [header, ...rows].join('\n');
    return { csv };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
