import { getSiteSettings } from '@/lib/config/site';
import { NPSForm } from './NPSForm';

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
