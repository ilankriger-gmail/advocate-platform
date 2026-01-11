import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/config/site';
import { NPSForm } from './NPSForm';

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

export default async function SejaNextloverPage() {
  const settings = await getSiteSettings([
    'site_name',
    'creator_name',
    'footer_text',
    'logo_url',
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <NPSForm
        siteName={settings.site_name}
        creatorName={settings.creator_name}
        logoUrl={settings.logo_url || '/logo.png'}
      />
    </div>
  );
}
