import Image from 'next/image';
import { getSiteSettings } from '@/lib/config/site';

/**
 * Layout compartilhado para paginas de autenticacao
 * Centraliza o conteudo com logo
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings(['site_name', 'logo_url']);
  const siteName = settings.site_name || 'Arena Te Amo';
  const logoUrl = settings.logo_url || '/logo.png';

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {logoUrl.startsWith('/') ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={180}
              height={60}
              className="h-16 w-auto"
              priority
            />
          ) : (
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-auto"
            />
          )}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
