import { Card } from '@/components/ui';
import { fetchLinkDoBemCampaigns } from '@/lib/linkdobem/sync';
import { LinkDoBemCampaignsList } from './LinkDoBemCampaignsList';
import { SyncButton } from './SyncButton';
import { ExternalLink, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnunciosPage() {
  // Buscar campanhas diretamente do Link do Bem (sempre atualizado)
  const campaigns = await fetchLinkDoBemCampaigns();
  
  const totalCampaigns = campaigns.length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">🤝</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Link do Bem</h1>
            <p className="text-gray-500 text-sm">Campanhas sincronizadas automaticamente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://linkdobem.org/category/campanhas-ativas/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver no site
          </a>
          <SyncButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <p className="text-3xl font-bold text-green-700">{totalCampaigns}</p>
          <p className="text-sm text-green-600">Campanhas Ativas</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-700">Sync Automático</p>
              <p className="text-xs text-blue-500">Atualiza 1x por dia</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 md:col-span-1 col-span-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="text-sm font-medium text-purple-700">UTM Automático</p>
              <p className="text-xs text-purple-500">?utm_source=arena_teamo</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Info */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <p className="text-sm text-green-800">
          <strong>✨ Integração automática:</strong> As campanhas são buscadas diretamente do 
          <a href="https://linkdobem.org" target="_blank" rel="noopener noreferrer" className="font-medium underline ml-1">
            linkdobem.org
          </a>
          . Você não precisa fazer nada — quando uma campanha nova entra lá, aparece aqui automaticamente!
        </p>
      </Card>

      {/* Lista de campanhas */}
      <LinkDoBemCampaignsList campaigns={campaigns} />
    </div>
  );
}
