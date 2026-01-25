'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ExternalLink, Heart } from 'lucide-react';

interface Campaign {
  wp_id: number;
  title: string;
  slug: string;
  url: string;
  excerpt: string;
  image_url: string | null;
  published_at: string;
}

export function LinkDoBemSection() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

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

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('linkdobem-carousel');
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (loading) {
    return (
      <section className="py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="min-w-[280px] h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (campaigns.length === 0) {
    return null; // Não mostra nada se não tem campanhas
  }

  return (
    <section className="py-6">
      {/* Header da seção */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Campanhas do Bem</h2>
            <p className="text-sm text-gray-500">Ajude quem precisa</p>
          </div>
        </div>
        
        {/* Controles do carrossel */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Carrossel */}
      <div
        id="linkdobem-carousel"
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {campaigns.slice(0, 6).map((campaign) => (
          <CampaignCard key={campaign.wp_id} campaign={campaign} />
        ))}
      </div>
    </section>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const utmUrl = `${campaign.url}?utm_source=arena_teamo&utm_medium=home_banner&utm_campaign=${campaign.slug}`;

  return (
    <a
      href={utmUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="min-w-[280px] max-w-[280px] bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
    >
      {/* Imagem */}
      <div className="relative h-32 bg-gradient-to-br from-green-400 to-emerald-500">
        {campaign.image_url ? (
          <Image
            src={campaign.image_url}
            alt={campaign.title}
            fill
            className="object-cover"
            sizes="280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Heart className="w-12 h-12 text-white/50" />
          </div>
        )}
        {/* Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-full text-xs font-medium text-green-700">
          🤝 Link do Bem
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-green-600 transition-colors">
          {campaign.title}
        </h3>
        {campaign.excerpt && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {campaign.excerpt}
          </p>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium">
          <span>Participar</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </a>
  );
}
