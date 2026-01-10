import Link from 'next/link';
import { Card, Avatar } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { PostWithAuthor } from '@/lib/supabase/types';

interface CreatorFeedProps {
  posts: PostWithAuthor[];
}

export function CreatorFeed({ posts }: CreatorFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Minhas Novidades</h2>
        </div>
        <Card className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500">Nenhum post do criador ainda</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full" />
          Minhas Novidades
        </h2>
        <Link href="/feed?type=creator" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          Ver todos
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post, index) => (
          <CreatorPostCard key={post.id} post={post} featured={index === 0} />
        ))}
      </div>
    </div>
  );
}

function CreatorPostCard({ post, featured }: { post: PostWithAuthor; featured?: boolean }) {
  const hasMedia = post.media_url && post.media_url.length > 0;

  if (featured && hasMedia) {
    return (
      <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
        {/* Featured image */}
        <div className="relative aspect-vídeo bg-gray-100">
          <img
            src={post.media_url![0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <span className="inline-block px-2 py-1 bg-purple-500 text-xs font-medium rounded mb-2">
              Em Destaque
            </span>
            <h3 className="text-lg font-bold line-clamp-2">{post.title}</h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-white/80">
              <span>{formatRelativeTime(post.created_at)}</span>
              <span>-</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {post.likes_count}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex gap-4">
        {hasMedia && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={post.media_url![0]}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {post.title}
          </h3>
          {post.content && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {post.content}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatRelativeTime(post.created_at)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {post.likes_count}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {post.comments_count}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
