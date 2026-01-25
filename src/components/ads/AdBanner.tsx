'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

export interface AdCampaign {
  id: string;
  name: string;
  description: string | null;
  original_url: string;
  utm_source: string;
  image_square: string | null;
  image_horizontal: string | null;
  image_vertical: string | null;
  image_card: string | null;
  cta_text: string;
  tags: string[];
  priority: number;
  impressions: number;
  clicks: number;
  is_active: boolean;
}

type BannerType = 'square' | 'horizontal' | 'vertical' | 'card' | 'feed';

interface AdBannerProps {
  type?: BannerType;
  position?: string;
  tags?: string[]; // Para matching de conteúdo
  className?: string;
  fallback?: React.ReactNode;
}

// Dimensões por tipo
const BANNER_SIZES: Record<BannerType, { width: number; height: number; imageKey: keyof AdCampaign }> = {
  square: { width: 300, height: 300, imageKey: 'image_square' },
  horizontal: { width: 728, height: 90, imageKey: 'image_horizontal' },
  vertical: { width: 300, height: 600, imageKey: 'image_vertical' },
  card: { width: 400, height: 300, imageKey: 'image_card' },
  feed: { width: 400, height: 300, imageKey: 'image_card' }, // Feed usa card
};

export function AdBanner({ 
  type = 'card', 
  position = 'unknown',
  tags = [],
  className = '',
  fallback = null
}: AdBannerProps) {
  const [campaign, setCampaign] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Buscar campanha ativa
  useEffect(() => {
    async function fetchCampaign() {
      const supabase = createClient();
      
      let query = supabase
        .from('ad_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      // Se tem tags, filtra por overlap
      if (tags.length > 0) {
        query = query.overlaps('tags', tags);
      }
      
      const { data, error } = await query.limit(1).single();
      
      if (error || !data) {
        // Tenta buscar qualquer campanha ativa
        const { data: fallbackData } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .limit(1)
          .single();
        
        setCampaign(fallbackData);
      } else {
        setCampaign(data);
      }
      
      setLoading(false);
    }
    
    fetchCampaign();
  }, [tags]);

  // Registrar impressão
  useEffect(() => {
    if (campaign) {
      // Incrementar impressões (fire and forget)
      const supabase = createClient();
      supabase.rpc('register_ad_impression', { p_campaign_id: campaign.id }).then(() => {});
    }
  }, [campaign?.id]);

  // Handler de clique
  const handleClick = useCallback(async () => {
    if (!campaign) return;
    
    const supabase = createClient();
    
    // Registrar clique
    await supabase.from('ad_clicks').insert({
      campaign_id: campaign.id,
      page_url: window.location.href,
      banner_type: type,
      banner_position: position,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });
    
    // Incrementar contador
    await supabase
      .from('ad_campaigns')
      .update({ clicks: campaign.clicks + 1 })
      .eq('id', campaign.id);
    
    // Abrir URL com UTM
    const url = new URL(campaign.original_url);
    url.searchParams.set('utm_source', campaign.utm_source);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }, [campaign, type, position]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} 
           style={{ aspectRatio: `${BANNER_SIZES[type].width}/${BANNER_SIZES[type].height}` }} />
    );
  }

  if (!campaign) {
    return fallback;
  }

  const { imageKey } = BANNER_SIZES[type];
  const imageUrl = campaign[imageKey] as string | null;

  if (!imageUrl || imageError) {
    return fallback;
  }

  return (
    <div 
      className={`relative cursor-pointer group overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all ${className}`}
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Badge "Publicidade" */}
      <div className="absolute top-2 left-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
        Publicidade
      </div>
      
      {/* Imagem */}
      <div className="relative w-full" style={{ aspectRatio: `${BANNER_SIZES[type].width}/${BANNER_SIZES[type].height}` }}>
        <Image
          src={imageUrl}
          alt={campaign.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImageError(true)}
          sizes={`${BANNER_SIZES[type].width}px`}
        />
      </div>
      
      {/* Overlay com CTA */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-white">
          <p className="font-semibold text-sm line-clamp-2">{campaign.name}</p>
          <span className="inline-block mt-2 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
            {campaign.cta_text} →
          </span>
        </div>
      </div>
    </div>
  );
}

// Variante para Feed (entre posts)
export function AdBannerFeed({ className = '' }: { className?: string }) {
  return (
    <div className={`my-4 ${className}`}>
      <AdBanner type="feed" position="feed" />
    </div>
  );
}

// Variante para Sidebar
export function AdBannerSidebar({ className = '' }: { className?: string }) {
  return (
    <div className={`sticky top-4 ${className}`}>
      <AdBanner type="vertical" position="sidebar" />
    </div>
  );
}

// Variante Mobile (quadrado ou card)
export function AdBannerMobile({ className = '' }: { className?: string }) {
  return (
    <div className={`px-4 ${className}`}>
      <AdBanner type="card" position="mobile" />
    </div>
  );
}
