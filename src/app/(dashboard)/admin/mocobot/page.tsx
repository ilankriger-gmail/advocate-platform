import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getMocoBotConfig, getMocoBotStats, getRecentActions } from '@/actions/mocobot-config';
import MocoBotPanel from './MocoBotPanel';

export const dynamic = 'force-dynamic';

export default async function AdminMocoBotPage() {
  const supabase = await createClient();

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }

  // Verificar se é admin/creator
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    redirect('/admin/login');
  }

  // Fetch data in parallel
  const [config, stats, recentActions] = await Promise.all([
    getMocoBotConfig(),
    getMocoBotStats(),
    getRecentActions(),
  ]);

  return (
    <MocoBotPanel
      config={config}
      stats={stats}
      recentActions={recentActions}
    />
  );
}
