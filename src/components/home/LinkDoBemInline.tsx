'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Heart, ChevronRight } from 'lucide-react';

interface Campaign {
  wp_id: number;
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
}

/**
 * Versão inline/compacta das campanhas do Link do Bem
 * Aparece no meio do feed, mostrando 2 campanhas em formato menor
 */
export function LinkDoBemInline() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/linkdobem/campaigns');
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
        <div className="flex gap-3">
          <div className="flex-1 h-24 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return null;
  }

  // Mostrar apenas 2 campanhas no inline
  const displayCampaigns = campaigns.slice(0, 2);

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-800">Campanhas do Bem</span>
        </div>
        <a
          href="https://linkdobem.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
        >
          Ver todas <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Cards compactos */}
      <div className="flex gap-3">
        {displayCampaigns.map((campaign) => (
          <CompactCampaignCard key={campaign.wp_id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
}

function CompactCampaignCard({ campaign }: { campaign: Campaign }) {
  const utmUrl = `${campaign.url}?utm_source=arena_teamo&utm_medium=feed_inline&utm_campaign=${campaign.slug}`;

  return (
    <a
      href={utmUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 bg-white rounded-lg overflow-hidden hover:shadow-md transition-all group"
    >
      {/* Imagem pequena */}
      <div className="relative h-20 bg-gradient-to-br from-green-400 to-emerald-500">
        {campaign.image_url ? (
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white/50" />
          </div>
        )}
      </div>

      {/* Título compacto */}
      <div className="p-2">
        <h4 className="text-xs font-medium text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
          {campaign.title}
        </h4>
        <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600">
          <span>Participar</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </div>
      </div>
    </a>
  );
}
