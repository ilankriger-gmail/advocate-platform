import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seja um NextLOVER',
  description: 'Faca parte da comunidade NextLOVERS e tenha acesso a beneficios exclusivos',
};

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
