import Link from 'next/link';
import { Card, Avatar, MemberBadge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import type { PostWithAuthor } from '@/lib/supabase/types';

interface CommunityFeedProps {
  posts: PostWithAuthor[];
}

export function CommunityFeed({ posts }: CommunityFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Da Comunidade</h2>
        </div>
        <Card className="p-6 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Seja o primeiro a postar na comunidade!</p>
          <Link
            href="/login"
            className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Entrar para postar
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full" />
          Da Comunidade
        </h2>
        <Link href="/feed" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
          Ver todos
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post) => (
          <CommunityPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function CommunityPostCard({ post }: { post: PostWithAuthor }) {
  const hasMedia = post.media_url && post.media_url.length > 0;
  const author = post.author;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      {hasMedia && post.media_url && (
        <div className="aspect-video bg-gray-100">
          <img
            src={post.media_url[0]}
            alt={post.title || 'Post'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={author?.avatar_url || undefined}
            name={author?.full_name || 'Usuário'}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {author?.full_name || 'Usuário'}
              </p>
              <MemberBadge memberNumber={author?.member_number} />
            </div>
            <p className="text-xs text-gray-500">{formatRelativeTime(post.created_at)}</p>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {post.title}
        </h3>
        {post.content && !hasMedia && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {post.content}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {post.likes_count}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comments_count}
          </span>
        </div>
      </div>
    </Card>
  );
}
