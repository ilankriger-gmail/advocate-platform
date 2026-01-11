'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Card, Avatar } from '@/components/ui';
import {
  VoteButtons,
  CommentsSection,
  ImageCarousel,
  YouTubeEmbed,
  InstagramEmbed,
  SaveButton,
  ShareButton,
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
        <Avatar
          src={post.author?.avatar_url || undefined}
          name={post.author?.full_name || 'Usuário'}
          size="md"
        />
        <div className="ml-3 flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">
            {post.author?.full_name || 'Usuário'}
          </p>
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

      {/* Ações - Votos, Save, Share */}
      <div className="p-3 flex items-center gap-2">
        <VoteButtons
          postId={post.id}
          initialScore={post.likes_count || 0}
          initialUserVote={null}
        />
        <span className="text-sm text-gray-500 flex-1">
          {post.comments_count || 0} comentários
        </span>
        <SaveButton postId={post.id} />
        <ShareButton postId={post.id} postTitle={post.title} />
      </div>

      {/* Conteúdo - Só mostra se tiver título ou conteúdo */}
      {(post.title || post.content) && (
        <div className="px-3 pb-3">
          {post.title && (
            <h3 className="font-semibold text-gray-900">{post.title}</h3>
          )}
          {post.content && post.content !== '<p></p>' && (
            <div
              className="text-sm text-gray-600 mt-1 line-clamp-3 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          )}
        </div>
      )}

      {/* Comentários */}
      <div className="border-t border-gray-100">
        <CommentsSection postId={post.id} commentsCount={post.comments_count || 0} />
      </div>
    </Card>
  );
}
