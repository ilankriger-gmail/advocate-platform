import type { Metadata } from 'next';
import { getSiteSettings } from '@/lib/config/site';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings(['site_name', 'site_description']);

  return {
    title: `Seja um ${settings.site_name.replace('LOVERS', 'LOVER')}`,
    description: `Faca parte da comunidade ${settings.site_name} e tenha acesso a beneficios exclusivos`,
  };
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {children}
    </div>
  );
}
