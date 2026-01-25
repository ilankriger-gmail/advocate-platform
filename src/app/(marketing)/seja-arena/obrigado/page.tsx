import { Suspense } from 'react';
import { getSiteSettings } from '@/lib/config/site';
import { ObrigadoContent } from './ObrigadoContent';

export const dynamic = 'force-dynamic';

// Loading fallback para Suspense
function LoadingFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="animate-spin w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      <p className="mt-4 text-gray-500">Carregando...</p>
    </main>
  );
}

export default async function ObrigadoPage() {
  const settings = await getSiteSettings(['site_name', 'footer_text']);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ObrigadoContent
        siteName={settings.site_name}
        footerText={settings.footer_text}
      />
    </Suspense>
  );
}
