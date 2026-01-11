import { Metadata } from 'next';
import { Suspense } from 'react';
import { getSiteSettings } from '@/lib/config/site';
import RegisterForm from '@/components/auth/RegisterForm';
import { Skeleton } from '@/components/ui';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_registro_title',
    'seo_registro_description',
  ]);

  return {
    title: settings.seo_registro_title,
    description: settings.seo_registro_description,
    openGraph: {
      title: settings.seo_registro_title,
      description: settings.seo_registro_description,
    },
  };
}

/**
 * Pagina de registro - Server Component que renderiza o formulario
 */
export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          Criar nova conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Comece a conectar sua marca com advocates engajados
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <RegisterForm />
      </Suspense>
    </>
  );
}
