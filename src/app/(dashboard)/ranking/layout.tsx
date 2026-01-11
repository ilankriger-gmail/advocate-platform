import { Metadata } from 'next';
import { getSiteSettings } from '@/lib/config/site';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_ranking_title',
    'seo_ranking_description',
  ]);

  return {
    title: settings.seo_ranking_title,
    description: settings.seo_ranking_description,
    openGraph: {
      title: settings.seo_ranking_title,
      description: settings.seo_ranking_description,
    },
  };
}

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
