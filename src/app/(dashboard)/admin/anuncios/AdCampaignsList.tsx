'use client';

import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye, EyeOff, ExternalLink, BarChart3 } from 'lucide-react';
import type { AdCampaign } from '@/components/ads';

interface AdCampaignsListProps {
  campaigns: AdCampaign[];
}

export function AdCampaignsList({ campaigns }: AdCampaignsListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const toggleActive = async (campaign: AdCampaign) => {
    setLoading(campaign.id);
    const supabase = createClient();
    
    await supabase
      .from('ad_campaigns')
      .update({ is_active: !campaign.is_active })
      .eq('id', campaign.id);
    
    router.refresh();
    setLoading(null);
  };

  const deleteCampaign = async (campaign: AdCampaign) => {
    if (!confirm(`Deletar campanha "${campaign.name}"?`)) return;
    
    setLoading(campaign.id);
    const supabase = createClient();
    
    await supabase
      .from('ad_campaigns')
      .delete()
      .eq('id', campaign.id);
    
    router.refresh();
    setLoading(null);
  };

  if (campaigns.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-gray-500">Nenhuma campanha cadastrada</p>
        <p className="text-sm text-gray-400 mt-1">
          Clique em "Nova Campanha" para começar
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-gray-900">Campanhas ({campaigns.length})</h2>
      
      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className={`p-4 ${!campaign.is_active ? 'opacity-60' : ''}`}>
            <div className="flex gap-4">
              {/* Preview da imagem */}
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {campaign.image_card || campaign.image_square ? (
                  <img 
                    src={campaign.image_card || campaign.image_square || ''} 
                    alt={campaign.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Sem imagem
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                    <a 
                      href={campaign.original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      {campaign.original_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <Badge className={campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                    {campaign.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                
                {campaign.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{campaign.description}</p>
                )}
                
                {/* Tags */}
                {campaign.tags && campaign.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {campaign.tags.map((tag) => (
                      <Badge key={tag} className="bg-purple-100 text-purple-700 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {campaign.impressions?.toLocaleString() || 0} impressões
                  </span>
                  <span>•</span>
                  <span>{campaign.clicks?.toLocaleString() || 0} cliques</span>
                  <span>•</span>
                  <span>
                    CTR: {campaign.impressions > 0 
                      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) 
                      : '0.00'}%
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleActive(campaign)}
                  disabled={loading === campaign.id}
                  className="p-2"
                >
                  {campaign.is_active ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/anuncios/${campaign.id}`)}
                  className="p-2"
                >
                  <Pencil className="w-4 h-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCampaign(campaign)}
                  disabled={loading === campaign.id}
                  className="p-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
