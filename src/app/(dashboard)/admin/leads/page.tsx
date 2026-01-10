import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LeadsList } from './LeadsList';
import { LeadFilters } from './LeadFilters';
import { CsvImport } from './CsvImport';
import type { NpsLead, LeadStatus } from '@/lib/supabase/types';

interface PageProps {
  searchParams: Promise<{
    status?: string;
    orderBy?: string;
  }>;
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

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
    redirect('/admin/login');
  }

  // Buscar estatisticas
  const { data: allLeads } = await supabase
    .from('nps_leads')
    .select('status, score');

  const stats = {
    total: allLeads?.length || 0,
    pending: allLeads?.filter(l => l.status === 'pending').length || 0,
    approved: allLeads?.filter(l => l.status === 'approved').length || 0,
    rejected: allLeads?.filter(l => l.status === 'rejected').length || 0,
    avgScore: allLeads?.length
      ? Math.round((allLeads.reduce((sum, l) => sum + l.score, 0) / allLeads.length) * 10) / 10
      : 0,
  };

  // Buscar leads com filtros
  const status = params.status || 'pending';
  const orderBy = params.orderBy || 'created_at';

  let query = supabase.from('nps_leads').select('*');

  if (status !== 'all') {
    query = query.eq('status', status as LeadStatus);
  }

  // Ordenacao (sempre desc para mostrar mais recentes/maiores primeiro)
  query = query.order(orderBy, { ascending: false });

  const { data: leads } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads NPS</h1>
          <p className="text-gray-500">Gerencie os leads capturados pelo formulario NPS</p>
        </div>
        <CsvImport />
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-yellow-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-green-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Aprovados</p>
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-pink-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">NPS Medio</p>
          <p className="text-2xl font-bold text-pink-600">{stats.avgScore}</p>
        </div>
      </div>

      {/* Filtros */}
      <LeadFilters stats={stats} />

      {/* Lista de leads com selecao em massa */}
      <LeadsList leads={leads || []} currentStatus={status} />
    </div>
  );
}
