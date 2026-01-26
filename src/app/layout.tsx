import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { Header } from '@/components/layout/Header';
import { getSiteSettings } from '@/lib/config/site';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'meta_title',
    'meta_description',
    'favicon_url',
    'site_name',
    'logo_url',
  ]);

  const faviconUrl = settings.favicon_url || '/favicon.svg';
  const siteName = settings.site_name || 'Arena Te Amo';
  const description = settings.meta_description || 'Comunidade oficial do O Moço do Te Amo';
  const logoUrl = settings.logo_url || '/logo.png';

  return {
    metadataBase: new URL('https://comunidade.omocodoteamo.com.br'),
    title: {
      default: settings.meta_title || siteName,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: ['comunidade', 'moço do te amo', 'arena', 'fãs', 'eventos', 'desafios'],
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      url: 'https://comunidade.omocodoteamo.com.br',
      siteName,
      title: settings.meta_title || siteName,
      description,
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.meta_title || siteName,
      description,
      images: [logoUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
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
  // Buscar configurações server-side
  const settings = await getSiteSettings(['logo_url', 'site_name', 'google_analytics_id']);
  const logoUrl = settings.logo_url || '/logo.png';
  const siteName = settings.site_name || 'Arena Te Amo';
  const gaId = settings.google_analytics_id;

  return (
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <GoogleAnalytics measurementId={gaId} />
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
