import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/layout/Header';
import { getSiteSettings } from '@/lib/config/site';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings(['meta_title', 'meta_description', 'favicon_url']);

  const faviconUrl = settings.favicon_url || '/favicon.svg';

  return {
    title: settings.meta_title,
    description: settings.meta_description,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Buscar logo server-side para passar ao Header
  const settings = await getSiteSettings(['logo_url', 'site_name']);
  const logoUrl = settings.logo_url || '/logo.png';
  const siteName = settings.site_name || 'Arena Te Amo';

  return (
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <QueryProvider>
          <AuthProvider>
            <ToastProvider>
              <SidebarProvider>
                <Header logoUrl={logoUrl} siteName={siteName} />
                <main>
                  {children}
                </main>
              </SidebarProvider>
            </ToastProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
