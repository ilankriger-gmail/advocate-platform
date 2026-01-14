import { Metadata } from 'next';
import { getDiscoverContent } from '@/actions/search';
import { DiscoverClient } from './DiscoverClient';

export const metadata: Metadata = {
  title: 'Descobrir',
  description: 'Explore posts, desafios, prêmios e mais da comunidade',
};

export default async function DiscoverPage() {
  // Buscar conteúdo inicial para SSR
  const initialContent = await getDiscoverContent();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <DiscoverClient initialContent={initialContent} />
      </div>
    </div>
  );
}
