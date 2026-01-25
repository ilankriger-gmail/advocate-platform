/**
 * Link do Bem - Sincronização automática de campanhas
 * Busca campanhas ativas do WordPress e sincroniza com o banco local
 */

import { createClient } from '@/lib/supabase/server';

const LINKDOBEM_API = 'https://linkdobem.org/wp-json/wp/v2';
const CAMPANHAS_ATIVAS_CATEGORY = 192;

interface WPPost {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
}

interface WPMedia {
  id: number;
  source_url: string;
  media_details?: {
    sizes?: {
      medium?: { source_url: string };
      large?: { source_url: string };
      full?: { source_url: string };
    };
  };
}

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

/**
 * Busca campanhas ativas do Link do Bem
 */
export async function fetchLinkDoBemCampaigns(): Promise<Campaign[]> {
  try {
    // Buscar posts da categoria "campanhas-ativas"
    const postsResponse = await fetch(
      `${LINKDOBEM_API}/posts?categories=${CAMPANHAS_ATIVAS_CATEGORY}&per_page=20&_embed`,
      { next: { revalidate: 3600 } } // Cache por 1 hora
    );

    if (!postsResponse.ok) {
      throw new Error(`Failed to fetch posts: ${postsResponse.status}`);
    }

    const posts: WPPost[] = await postsResponse.json();

    // Buscar imagens em destaque
    const mediaIds = posts
      .map(p => p.featured_media)
      .filter(id => id > 0);

    let mediaMap = new Map<number, string>();

    if (mediaIds.length > 0) {
      const mediaResponse = await fetch(
        `${LINKDOBEM_API}/media?include=${mediaIds.join(',')}&per_page=50`
      );

      if (mediaResponse.ok) {
        const mediaList: WPMedia[] = await mediaResponse.json();
        mediaList.forEach(m => {
          const imageUrl = 
            m.media_details?.sizes?.large?.source_url ||
            m.media_details?.sizes?.medium?.source_url ||
            m.source_url;
          mediaMap.set(m.id, imageUrl);
        });
      }
    }

    // Mapear para formato interno
    return posts.map(post => ({
      wp_id: post.id,
      title: decodeHtmlEntities(post.title.rendered),
      slug: post.slug,
      url: post.link,
      excerpt: decodeHtmlEntities(stripHtml(post.excerpt.rendered)),
      image_url: mediaMap.get(post.featured_media) || null,
      published_at: post.date,
      is_active: true,
    }));
  } catch (error) {
    console.error('Erro ao buscar campanhas do Link do Bem:', error);
    return [];
  }
}

/**
 * Sincroniza campanhas com o banco de dados
 */
export async function syncLinkDoBemCampaigns(): Promise<{
  added: number;
  updated: number;
  removed: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Buscar campanhas do WordPress
    const wpCampaigns = await fetchLinkDoBemCampaigns();
    
    if (wpCampaigns.length === 0) {
      return { added: 0, updated: 0, removed: 0, error: 'Nenhuma campanha encontrada' };
    }

    // Buscar campanhas existentes no banco
    const { data: existingCampaigns } = await supabase
      .from('linkdobem_campaigns')
      .select('id, wp_id');

    const existingMap = new Map(
      (existingCampaigns || []).map(c => [c.wp_id, c.id])
    );

    let added = 0;
    let updated = 0;

    // Upsert campanhas
    for (const campaign of wpCampaigns) {
      const existingId = existingMap.get(campaign.wp_id);

      if (existingId) {
        // Atualizar existente
        await supabase
          .from('linkdobem_campaigns')
          .update({
            title: campaign.title,
            url: campaign.url,
            excerpt: campaign.excerpt,
            image_url: campaign.image_url,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingId);
        updated++;
      } else {
        // Inserir nova
        await supabase
          .from('linkdobem_campaigns')
          .insert({
            wp_id: campaign.wp_id,
            title: campaign.title,
            slug: campaign.slug,
            url: campaign.url,
            excerpt: campaign.excerpt,
            image_url: campaign.image_url,
            published_at: campaign.published_at,
            is_active: true,
          });
        added++;
      }
    }

    // Desativar campanhas que não estão mais ativas no WP
    const activeWpIds = wpCampaigns.map(c => c.wp_id);
    const { data: toDeactivate } = await supabase
      .from('linkdobem_campaigns')
      .select('id')
      .eq('is_active', true)
      .not('wp_id', 'in', `(${activeWpIds.join(',')})`);

    let removed = 0;
    if (toDeactivate && toDeactivate.length > 0) {
      await supabase
        .from('linkdobem_campaigns')
        .update({ is_active: false })
        .in('id', toDeactivate.map(c => c.id));
      removed = toDeactivate.length;
    }

    return { added, updated, removed };
  } catch (error) {
    console.error('Erro ao sincronizar campanhas:', error);
    return { added: 0, updated: 0, removed: 0, error: String(error) };
  }
}

// Helpers
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—');
}
