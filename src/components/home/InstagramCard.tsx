'use client';

import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Card, Avatar, MemberBadge } from '@/components/ui';
import {
  ImageCarousel,
  YouTubeEmbed,
  InstagramEmbed,
  SaveButton,
  ShareButton,
  LikeButton,
  InlineComments,
} from '@/components/posts';
import { formatRelativeTime } from '@/lib/utils';
import type { PostWithAuthor } from '@/lib/supabase/types';

// Sanitizar HTML para prevenir XSS
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

interface InstagramCardProps {
  post: PostWithAuthor;
}

export function InstagramCard({ post }: InstagramCardProps) {
  const hasImages = post.media_url && post.media_url.length > 0;
  const hasYoutube = !!post.youtube_url;
  const hasInstagram = !!post.instagram_url;
  const hasMedia = hasImages || hasYoutube || hasInstagram;

  return (
    <Card className="overflow-hidden">
      {/* Header: Avatar + Nome + Tempo */}
      <div className="flex items-center p-3">
        <Link href={`/profile/${post.author?.id}`}>
          <Avatar
            src={post.author?.avatar_url || undefined}
            name={post.author?.full_name || 'Usuário'}
            size="md"
          />
        </Link>
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link href={`/profile/${post.author?.id}`} className="hover:underline">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {post.author?.full_name || 'Usuário'}
              </p>
            </Link>
            <MemberBadge memberNumber={post.author?.member_number} />
          </div>
          <p className="text-xs text-gray-500">
            {formatRelativeTime(post.created_at)}
          </p>
        </div>
        {post.author?.is_creator && (
          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-medium">
            Criador
          </span>
        )}
      </div>

      {/* Badge de Pedido de Ajuda */}
      {post.content_category === 'help_request' && (
        <div className="mx-3 mb-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-xs text-blue-700 font-medium">
            Pedido de ajuda da comunidade
          </span>
        </div>
      )}

      {/* Mídia - Aspect 4:5 */}
      {hasImages && (
        <div className="aspect-[4/5] bg-gray-100">
          <ImageCarousel
            images={post.media_url!}
            aspectRatio="portrait"
            alt={post.title}
          />
        </div>
      )}

      {/* YouTube Embed */}
      {hasYoutube && !hasImages && (
        <YouTubeEmbed url={post.youtube_url!} />
      )}

      {/* Instagram Embed */}
      {hasInstagram && !hasImages && !hasYoutube && (
        <InstagramEmbed url={post.instagram_url!} />
      )}

      {/* Ações - Like, Comment count, Save, Share */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialCount={post.likes_count || 0}
            initialLiked={false}
          />
          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {(post.comments_count || 0) > 0 && (
              <span className="text-sm font-semibold tabular-nums">{post.comments_count}</span>
            )}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <SaveButton postId={post.id} />
          <ShareButton postId={post.id} postTitle={post.title} />
        </div>
      </div>

      {/* Conteúdo - Só mostra se tiver título ou conteúdo */}
      {(post.title || post.content) && (
        <div className="px-3 pb-3">
          {post.title && (
            <h3 className="font-semibold text-gray-900">{post.title}</h3>
          )}
          {post.content && post.content !== '<p></p>' && (
            <div
              className="text-sm text-gray-600 mt-1 line-clamp-3 prose prose-sm max-w-none whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          )}
          <Link
            href={`/post/${post.id}`}
            className="text-sm text-gray-400 hover:text-gray-600 mt-1 inline-block"
          >
            ver mais
          </Link>
        </div>
      )}

      {/* Comentários inline */}
      <div className="border-t border-gray-100">
        <InlineComments postId={post.id} commentsCount={post.comments_count || 0} />
      </div>
    </Card>
  );
}
