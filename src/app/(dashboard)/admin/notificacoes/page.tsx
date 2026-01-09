import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NotificationStats } from './NotificationStats';
import { NotificationsList } from './NotificationsList';

export const metadata = {
  title: 'Notificacoes | Admin',
  description: 'Dashboard de notificacoes do sistema hibrido',
};

interface NotificationsPageProps {
  searchParams: Promise<{
    channel?: string;
    status?: string;
  }>;
}

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const supabase = await createClient();

  // Verificar autenticacao
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/admin/login');
  }

  // Verificar se e admin/creator
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_creator')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && !profile.is_creator)) {
    redirect('/');
  }

  // Buscar parametros de filtro
  const params = await searchParams;
  const channelFilter = params.channel || 'all';
  const statusFilter = params.status || 'all';

  // Buscar estatisticas
  const { data: emailStats } = await supabase
    .from('notifications_log')
    .select('status')
    .eq('channel', 'email');

  const { data: whatsappStats } = await supabase
    .from('notifications_log')
    .select('status')
    .eq('channel', 'whatsapp');

  const { data: pendingTasks } = await supabase
    .from('scheduled_tasks')
    .select('id')
    .eq('status', 'pending');

  // Calcular estatisticas
  const stats = {
    totalEmails: emailStats?.length || 0,
    emailsOpened: emailStats?.filter(e => e.status === 'opened').length || 0,
    emailsDelivered: emailStats?.filter(e => e.status === 'delivered' || e.status === 'opened').length || 0,
    totalWhatsApp: whatsappStats?.length || 0,
    whatsappDelivered: whatsappStats?.filter(w => w.status === 'delivered' || w.status === 'opened').length || 0,
    whatsappRead: whatsappStats?.filter(w => w.status === 'opened').length || 0,
    pendingTasks: pendingTasks?.length || 0,
  };

  // Buscar notificacoes recentes
  let query = supabase
    .from('notifications_log')
    .select(`
      *,
      nps_leads (
        id,
        name,
        email,
        phone
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (channelFilter !== 'all') {
    query = query.eq('channel', channelFilter);
  }

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: notifications } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificacoes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dashboard do sistema de notificacoes hibrido (Email + WhatsApp)
          </p>
        </div>
      </div>

      {/* Estatisticas */}
      <NotificationStats stats={stats} />

      {/* Lista de Notificacoes */}
      <NotificationsList
        notifications={notifications || []}
        channelFilter={channelFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
