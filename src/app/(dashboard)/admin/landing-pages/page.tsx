import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import { LPTypeSection } from './LPTypeSection';
import { SignupStats } from './SignupStats';
import { getLandingPageStats, getSignupsByPeriod } from '@/actions/landing-stats';

export const dynamic = 'force-dynamic';

export default async function AdminLandingPagesPage() {
  const supabase = await createClient();

  // Buscar desafios (incluindo slug)
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, title, icon, type, is_active, thumbnail_url, slug')
    .order('created_at', { ascending: false });

  // Buscar premios (incluindo slug)
  const { data: rewards } = await supabase
    .from('rewards')
    .select('id, name, type, is_active, image_url, slug')
    .order('created_at', { ascending: false });

  // Buscar contagem de leads por source
  const { data: leadsCount } = await supabase
    .from('nps_leads')
    .select('source_type, source_id')
    .not('source_id', 'is', null);

  // Mapear contagem de leads por source_id
  const leadsMap = new Map<string, number>();
  (leadsCount || []).forEach((lead) => {
    if (lead.source_id) {
      const current = leadsMap.get(lead.source_id) || 0;
      leadsMap.set(lead.source_id, current + 1);
    }
  });

  // Processar desafios - usar slug quando disponível, senão usa ID
  const challengeItems = (challenges || []).map((c) => {
    const identifier = c.slug || c.id;
    return {
      id: c.id,
      title: c.title,
      icon: c.icon,
      type: c.type,
      is_active: c.is_active,
      thumbnail_url: c.thumbnail_url,
      slug: c.slug,
      leadsCount: leadsMap.get(c.id) || 0,
      lpType: 'desafio' as const,
      lpUrl: `/lp/desafio/${identifier}`,
      lpUrlDireto: `/convite/desafio/${identifier}`,
    };
  });

  // Processar premios - usar slug quando disponível, senão usa ID
  const rewardItems = (rewards || []).map((r) => {
    const identifier = r.slug || r.id;
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      is_active: r.is_active,
      image_url: r.image_url,
      slug: r.slug,
      leadsCount: leadsMap.get(r.id) || 0,
      lpType: 'premio' as const,
      lpUrl: `/lp/premio/${identifier}`,
      lpUrlDireto: `/convite/premio/${identifier}`,
    };
  });

  // Calcular totais
  const totalLPs = challengeItems.length + rewardItems.length;
  const totalLeads = (leadsCount || []).length;
  const activeChallenges = challengeItems.filter((c) => c.is_active).length;
  const activeRewards = rewardItems.filter((r) => r.is_active).length;

  // Buscar estatísticas de origem dos inscritos
  const [{ data: landingStats }, signupTotals] = await Promise.all([
    getLandingPageStats(),
    getSignupsByPeriod(),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Pages</h1>
          <p className="text-gray-500 text-sm">Links para captação de leads por desafio ou prêmio</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <p className="text-3xl font-bold text-indigo-700">{totalLPs}</p>
          <p className="text-sm text-indigo-600">Landing Pages</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-3xl font-bold text-green-700">{totalLeads}</p>
          <p className="text-sm text-green-600">Leads Capturados</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
          <p className="text-3xl font-bold text-pink-700">{activeChallenges}</p>
          <p className="text-sm text-pink-600">Desafios Ativos</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <p className="text-3xl font-bold text-amber-700">{activeRewards}</p>
          <p className="text-sm text-amber-600">Prêmios Ativos</p>
        </Card>
      </div>

      {/* Estatísticas de Origem */}
      <SignupStats stats={landingStats || []} totals={signupTotals} />

      {/* Legenda */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-medium text-xs">NPS</span>
            <span className="text-blue-800">LP com pesquisa NPS antes do cadastro</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-500 text-white rounded font-medium text-xs">Direto</span>
            <span className="text-blue-800">LP direto para cadastro (sem NPS)</span>
          </div>
        </div>
      </Card>

      {/* Seções por Tipo */}
      <div className="space-y-4">
        {/* Desafios */}
        <LPTypeSection
          title="Landing Pages de Desafios"
          icon="🎯"
          color="text-pink-700"
          bgColor="bg-pink-50 border-pink-200"
          items={challengeItems}
          defaultOpen={true}
        />

        {/* Prêmios */}
        <LPTypeSection
          title="Landing Pages de Prêmios"
          icon="🎁"
          color="text-amber-700"
          bgColor="bg-amber-50 border-amber-200"
          items={rewardItems}
          defaultOpen={true}
        />
      </div>
    </div>
  );
}
