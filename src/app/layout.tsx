import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NextLOVERS - Comunidade O Moco do Te Amo',
  description: 'Comunidade oficial de O Moco do Te Amo | NextlevelDJ',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
