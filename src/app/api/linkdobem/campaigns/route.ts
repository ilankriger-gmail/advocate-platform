import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchLinkDoBemCampaigns } from '@/lib/linkdobem/sync';

/**
 * GET /api/linkdobem/campaigns
 * Lista campanhas ativas do Link do Bem
 * Tenta buscar do banco, se vazio busca direto da API
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Buscar do banco primeiro
    const { data: campaigns, error } = await supabase
      .from('linkdobem_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false });

    // Se tem campanhas no banco, retorna
    if (campaigns && campaigns.length > 0) {
      return NextResponse.json({
        source: 'database',
        campaigns,
        count: campaigns.length,
      });
    }

    // Se não tem no banco, busca direto da API do WordPress
    const wpCampaigns = await fetchLinkDoBemCampaigns();

    return NextResponse.json({
      source: 'wordpress_api',
      campaigns: wpCampaigns,
      count: wpCampaigns.length,
      note: 'Campanhas buscadas diretamente. Execute /api/linkdobem/sync para salvar no banco.',
    });
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campanhas', details: String(error) },
      { status: 500 }
    );
  }
}
