import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/config/site';
import LoginForm from './LoginForm';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_login_title',
    'seo_login_description',
  ]);

  return {
    title: settings.seo_login_title,
    description: settings.seo_login_description,
    openGraph: {
      title: settings.seo_login_title,
      description: settings.seo_login_description,
    },
  };
}

export default async function LoginPage() {
  // Buscar configurações do site
  const settings = await getSiteSettings(['login_title', 'login_subtitle', 'logo_url']);

  return (
    <LoginForm
      siteName={settings.login_title}
      subtitle={settings.login_subtitle}
      logoUrl={settings.logo_url}
    />
  );
}
