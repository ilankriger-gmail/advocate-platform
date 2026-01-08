import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSavedPosts } from '@/actions/saves';
import { InstagramCard } from '@/components/home';
import { Card, Skeleton } from '@/components/ui';

export const metadata = {
  title: 'Posts Salvos | NextLOVERS',
  description: 'Seus posts favoritos salvos',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
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

async function SavedPostsFeed() {
  const { posts } = await getSavedPosts();

  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum post salvo ainda
        </h3>
        <p className="text-gray-500">
          Salve posts que você gostou para acessá-los depois!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <InstagramCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default async function SavedPostsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Posts Salvos</h1>
        <p className="text-gray-500 mt-1">
          Posts que você salvou para ver depois
        </p>
      </div>

      {/* Feed de posts salvos */}
      <div className="max-w-[500px] mx-auto">
        <Suspense fallback={<LoadingSkeleton />}>
          <SavedPostsFeed />
        </Suspense>
      </div>
    </div>
  );
}
