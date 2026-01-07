import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getCreatorProfile, getCreatorPosts, getCommunityPosts } from '@/lib/supabase/queries';
import { HeroSection, CreatorFeed, CommunityFeed } from '@/components/home';
import { Card, Skeleton } from '@/components/ui';

// Loading fallbacks
function CreatorFeedLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Card className="overflow-hidden">
        <Skeleton className="aspect-video w-full" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Card>
    </div>
  );
}

function CommunityFeedLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-36" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Async components for streaming
async function CreatorFeedSection() {
  const posts = await getCreatorPosts(5);
  return <CreatorFeed posts={posts} />;
}

async function CommunityFeedSection() {
  const posts = await getCommunityPosts(8);
  return <CommunityFeed posts={posts} />;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const creator = await getCreatorProfile();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection creator={creator} isLoggedIn={isLoggedIn} />

      {/* Main Content - Magazine Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creator Feed - Sidebar Left */}
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <div className="lg:sticky lg:top-20">
            <Suspense fallback={<CreatorFeedLoading />}>
              <CreatorFeedSection />
            </Suspense>
          </div>
        </aside>

        {/* Community Feed - Main Content */}
        <section className="lg:col-span-8 order-1 lg:order-2">
          <Suspense fallback={<CommunityFeedLoading />}>
            <CommunityFeedSection />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
