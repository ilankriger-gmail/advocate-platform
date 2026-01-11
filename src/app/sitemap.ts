import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = 'https://comunidade.omocodoteamo.com.br';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Paginas estaticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/desafios`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/premios`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/seja-arena`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Buscar eventos publicos ativos
  const { data: events } = await supabase
    .from('events')
    .select('id, updated_at')
    .eq('is_active', true)
    .order('start_time', { ascending: false });

  const eventPages: MetadataRoute.Sitemap = (events || []).map((event) => ({
    url: `${BASE_URL}/eventos/${event.id}`,
    lastModified: new Date(event.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Buscar desafios ativos
  const { data: challenges } = await supabase
    .from('challenges')
    .select('id, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const challengePages: MetadataRoute.Sitemap = (challenges || []).map((challenge) => ({
    url: `${BASE_URL}/desafios/${challenge.id}`,
    lastModified: new Date(challenge.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...challengePages];
}
