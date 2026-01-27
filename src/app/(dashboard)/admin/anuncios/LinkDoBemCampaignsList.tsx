'use client';

import { Card } from '@/components/ui';
import { ExternalLink, Calendar, MousePointer } from 'lucide-react';
import Image from 'next/image';

interface Campaign {
  wp_id: number;
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
  is_active: boolean;
}

interface Props {
  campaigns: Campaign[];
}

export function LinkDoBemCampaignsList({ campaigns }: Props) {
  if (campaigns.length === 0) {
    return (
      <Card className="p-8 text-center">
        <span className="text-4xl mb-4 block">🤷</span>
        <p className="text-gray-500">Nenhuma campanha ativa no momento</p>
        <p className="text-sm text-gray-400 mt-2">
          As campanhas aparecem automaticamente quando são publicadas no Link do Bem
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Campanhas Disponíveis ({campaigns.length})
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.wp_id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  // Adicionar UTM ao link
  const utmUrl = `${campaign.url}?utm_source=arena_teamo&utm_medium=banner&utm_campaign=${campaign.slug}`;
  
  const publishedDate = new Date(campaign.published_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Imagem */}
      <div className="relative aspect-video bg-gray-100">
        {campaign.image_url ? (
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500">
            <span className="text-4xl">🤝</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2">
          {campaign.title}
        </h3>
        
        {campaign.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {campaign.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {publishedDate}
          </span>
        </div>

        {/* Botões */}
        <div className="flex gap-2 pt-2">
          <a
            href={utmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir Campanha
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(utmUrl);
              alert('Link copiado!');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            title="Copiar link com UTM"
          >
            📋
          </button>
        </div>
      </div>
    </Card>
  );
}
