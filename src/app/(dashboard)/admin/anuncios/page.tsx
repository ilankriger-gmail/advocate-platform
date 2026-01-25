import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { AdCampaignsList } from './AdCampaignsList';
import { NewCampaignButton } from './NewCampaignButton';

export const dynamic = 'force-dynamic';

export default async function AdminAnunciosPage() {
  const supabase = await createClient();
  
  // Buscar campanhas
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  
  // Estatísticas
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.is_active).length || 0;
  const totalClicks = campaigns?.reduce((acc, c) => acc + (c.clicks || 0), 0) || 0;
  const totalImpressions = campaigns?.reduce((acc, c) => acc + (c.impressions || 0), 0) || 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📢 Anúncios</h1>
          <p className="text-gray-500 text-sm">Gerencie banners e campanhas do Link do Bem</p>
        </div>
        <NewCampaignButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <p className="text-2xl font-bold text-blue-700">{totalCampaigns}</p>
          <p className="text-xs text-blue-600">Campanhas</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-2xl font-bold text-green-700">{activeCampaigns}</p>
          <p className="text-xs text-green-600">Ativas</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <p className="text-2xl font-bold text-purple-700">{totalImpressions.toLocaleString()}</p>
          <p className="text-xs text-purple-600">Impressões</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
          <p className="text-2xl font-bold text-orange-700">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-orange-600">Cliques</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-100">
          <p className="text-2xl font-bold text-cyan-700">{ctr}%</p>
          <p className="text-xs text-cyan-600">CTR</p>
        </Card>
      </div>

      {/* Info sobre UTM */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-sm text-amber-800">
          <strong>💡 Dica:</strong> Todos os links saem com <code className="bg-amber-100 px-1 rounded">?utm_source=site_teamo_MAIS</code> automaticamente.
        </p>
      </Card>

      {/* Lista de campanhas */}
      <AdCampaignsList campaigns={campaigns || []} />
    </div>
  );
}
