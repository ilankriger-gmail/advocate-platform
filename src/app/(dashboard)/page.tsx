import { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { getInitialFeedPosts } from '@/actions/feed';
import { getCommunityStats } from '@/actions/stats';
import { HeroSection, FeedTabs, LeaderboardWidget } from '@/components/home';
import { SuggestedUsers } from '@/components/social';
import { Card, Skeleton } from '@/components/ui';


export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_home_title',
    'seo_home_description',
  ]);

  return {
    title: settings.seo_home_title,
    description: settings.seo_home_description,
    openGraph: {
      title: settings.seo_home_title,
      description: settings.seo_home_description,
    },
  };
}

// Loading fallback para o feed
function FeedLoading() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex border-b border-gray-200 mb-6">
        <Skeleton className="flex-1 h-10" />
        <Skeleton className="flex-1 h-10" />
      </div>
      {/* Post cards skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

// Async component para carregar os posts iniciais (SSR)
async function FeedSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const communityPosts = await getInitialFeedPosts('community', 10);

  return (
    <FeedTabs
      initialCommunityPosts={communityPosts}
      isLoggedIn={isLoggedIn}
    />
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: { user } }, stats] = await Promise.all([
    supabase.auth.getUser(),
    getCommunityStats(),
  ]);
  const isLoggedIn = !!user;

  return (
    <div className="space-y-6">
      {/* Hero Section - Banner (apenas para visitantes não logados) */}
      {!isLoggedIn && <HeroSection isLoggedIn={false} stats={stats} />}

      {/* Main Content - Feed + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feed Principal com Tabs */}
        <main className="lg:col-span-8 order-1">
          <div className="max-w-[500px] mx-auto">
            <Suspense fallback={<FeedLoading />}>
              <FeedSection isLoggedIn={isLoggedIn} />
            </Suspense>
          </div>
        </main>

        {/* Sidebar - Leaderboard e Sugestões */}
        <aside className="lg:col-span-4 order-2">
          <div className="lg:sticky lg:top-20 space-y-6">
            <Suspense fallback={<Card className="p-4"><Skeleton className="h-48" /></Card>}>
              <LeaderboardWidget />
            </Suspense>
            {isLoggedIn && <SuggestedUsers limit={5} />}
          </div>
        </aside>
      </div>
    </div>
  );
}
