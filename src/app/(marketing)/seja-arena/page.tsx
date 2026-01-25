import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/config/site';
import { NPSForm } from './NPSForm';


export const dynamic = 'force-dynamic';
interface PageProps {
  searchParams: Promise<{
    source?: string;
    id?: string;
    name?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_seja_arena_title',
    'seo_seja_arena_description',
  ]);

  return {
    title: settings.seo_seja_arena_title,
    description: settings.seo_seja_arena_description,
    openGraph: {
      title: settings.seo_seja_arena_title,
      description: settings.seo_seja_arena_description,
    },
  };
}

export default async function SejaNextloverPage({ searchParams }: PageProps) {
  const [settings, params] = await Promise.all([
    getSiteSettings([
      'site_name',
      'creator_name',
      'footer_text',
      'logo_url',
    ]),
    searchParams,
  ]);

  // Extrair dados de origem (se vieram de uma landing page)
  const sourceData = params.source && params.id ? {
    sourceType: params.source as 'landing_challenge' | 'landing_reward',
    sourceId: params.id,
    sourceName: params.name ? decodeURIComponent(params.name) : undefined,
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <NPSForm
        siteName={settings.site_name}
        creatorName={settings.creator_name}
        logoUrl={settings.logo_url || '/logo.png'}
        sourceData={sourceData}
      />
    </div>
  );
}
