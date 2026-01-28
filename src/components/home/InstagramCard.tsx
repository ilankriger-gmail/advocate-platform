'use client';

import { useState, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { Card, Avatar, MemberBadge } from '@/components/ui';
import {
  ImageCarousel,
  YouTubeEmbed,
  InstagramEmbed,
  SaveButton,
  ShareButton,
  LikeButton,
} from '@/components/posts';
import { formatRelativeTime } from '@/lib/utils';
import { commentPost } from '@/actions/posts';
import type { PostWithAuthor, CommentPreview } from '@/lib/supabase/types';

// Sanitizar HTML simples sem DOMPurify (15KB a menos no bundle)
function sanitizeHtml(html: string): string {
  // Strip all tags except allowed ones
  const allowed = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'];
  const regex = new RegExp(`<(?!\\/?(${allowed.join('|')})\\b)[^>]*>`, 'gi');
  return html.replace(regex, '');
}

interface InstagramCardProps {
  post: PostWithAuthor;
}

export function InstagramCard({ post }: InstagramCardProps) {
  const [comments, setComments] = useState<CommentPreview[]>(post.comment_previews || []);
  const [localCount, setLocalCount] = useState(post.comments_count || 0);
  const [newComment, setNewComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmitComment = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = newComment.trim();
      if (!text) return;
      setNewComment('');

      startTransition(async () => {
        const result = await commentPost(post.id, text);
        if (result.success && result.data) {
          // Add optimistic comment
          const newC: CommentPreview = {
            id: result.data.id,
            content: text,
            created_at: new Date().toISOString(),
            author: null, // Will show as "Você"
          };
          setComments(prev => [...prev.slice(-1), newC]);
          setLocalCount(prev => prev + 1);
        }
      });
    },
    [newComment, post.id],
  );

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

      {/* Comentários inline — dados do server (zero extra requests) */}
      <div className="border-t border-gray-100 px-4 py-3">
        {/* Ver todos */}
        {localCount > 2 && (
          <Link
            href={`/post/${post.id}`}
            className="block text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2"
          >
            Ver todos os {localCount} comentários
          </Link>
        )}

        {/* Preview dos últimos 2 comentários */}
        {comments.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2 text-[14px]">
                <Link
                  href={`/profile/${comment.author?.id || ''}`}
                  className="font-semibold text-gray-900 hover:text-primary-600 transition-colors shrink-0"
                >
                  {comment.author?.full_name || 'Você'}
                </Link>
                <span className="text-gray-600 break-words min-w-0 line-clamp-2">
                  {comment.content}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Input de comentário inline */}
        <form onSubmit={handleSubmitComment} className="flex items-center gap-2 mt-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-gray-300 text-gray-700 py-1"
            disabled={isPending}
          />
          {newComment.trim() && (
            <button
              type="submit"
              disabled={isPending}
              className="text-sm font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {isPending ? '...' : 'Publicar'}
            </button>
          )}
        </form>
      </div>
    </Card>
  );
}
