'use client';

import { useEffect, useState, useTransition, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Avatar, Badge, Button, MemberBadge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { getPostWithDetails, getPostComments, commentPost, likeComment } from '@/actions/posts';
import ImageCarousel from '@/components/posts/ImageCarousel';
import YouTubeEmbed from '@/components/posts/YouTubeEmbed';
import InstagramEmbed from '@/components/posts/InstagramEmbed';
import { LikeButton } from '@/components/posts/LikeButton';
import type { PostWithAuthor } from '@/types/post';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

// ─── Comment types ──────────────────────────────────────────

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  likes_count?: number;
  is_liked_by_user?: boolean;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

// ─── Single Comment ─────────────────────────────────────────

function CommentItem({
  comment,
  onReply,
  onLike,
  isReply = false,
}: {
  comment: Comment;
  onReply: (parentId: string, authorName: string) => void;
  onLike: (commentId: string) => void;
  isReply?: boolean;
}) {
  const authorName = comment.author?.full_name || 'Usuário';
  const authorId = comment.author?.id;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      {authorId ? (
        <Link href={`/profile/${authorId}`} className="shrink-0">
          <Avatar name={authorName} src={comment.author?.avatar_url || undefined} size="sm" />
        </Link>
      ) : (
        <Avatar name={authorName} size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {authorId ? (
            <Link href={`/profile/${authorId}`} className="font-semibold text-sm text-surface-900 hover:text-primary-600 transition-colors">
              {authorName}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-surface-900">{authorName}</span>
          )}
          <span className="text-sm text-surface-700 break-words">{comment.content}</span>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-surface-400">{formatRelativeTime(comment.created_at)}</span>
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              comment.is_liked_by_user ? 'text-red-500' : 'text-surface-400 hover:text-red-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={comment.is_liked_by_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {(comment.likes_count || 0) > 0 && <span>{comment.likes_count}</span>}
          </button>
          <button onClick={() => onReply(comment.id, authorName)} className="text-xs font-medium text-surface-400 hover:text-primary-600 transition-colors">
            Responder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Post Detail Page ───────────────────────────────────────

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load post + comments
  useEffect(() => {
    if (!postId) return;

    async function load() {
      setIsLoading(true);
      const result = await getPostWithDetails(postId);
      if (result.error || !result.data) {
        setError(result.error || 'Post não encontrado');
        setIsLoading(false);
        return;
      }
      setPost(result.data.post as PostWithAuthor);
      setUserVote(result.data.userVote);

      // Load comments
      const commentsData = await getPostComments(postId);
      setComments(commentsData as Comment[]);
      setIsLoading(false);
    }
    load();
  }, [postId]);

  // Comment actions
  const handleReply = useCallback((parentId: string, authorName: string) => {
    setReplyingTo({ id: parentId, name: authorName });
    setNewComment(`@${authorName} `);
  }, []);

  const updateCommentLikes = (list: Comment[], commentId: string, liked: boolean, count: number): Comment[] => {
    return list.map((c) => {
      if (c.id === commentId) return { ...c, is_liked_by_user: liked, likes_count: count };
      if (c.replies?.length) return { ...c, replies: updateCommentLikes(c.replies, commentId, liked, count) };
      return c;
    });
  };

  const findComment = (list: Comment[], id: string): Comment | undefined => {
    for (const c of list) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = findComment(c.replies, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleLikeComment = useCallback(
    (commentId: string) => {
      const comment = findComment(comments, commentId);
      if (!comment) return;

      const newLiked = !comment.is_liked_by_user;
      const newCount = (comment.likes_count || 0) + (newLiked ? 1 : -1);
      setComments((prev) => updateCommentLikes(prev, commentId, newLiked, newCount));

      startTransition(async () => {
        const result = await likeComment(commentId);
        if (result.success && result.data) {
          setComments((prev) => updateCommentLikes(prev, commentId, result.data!.liked, result.data!.likesCount));
        }
      });
    },
    [comments, startTransition],
  );

  const handleSubmitComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      const content = newComment;
      const parentId = replyingTo?.id;
      setNewComment('');
      setReplyingTo(null);

      startTransition(async () => {
        const result = await commentPost(postId, content, parentId);
        if (result.success) {
          const data = await getPostComments(postId);
          setComments(data as Comment[]);
        }
      });
    },
    [newComment, replyingTo, postId, startTransition],
  );

  // Flatten replies for Instagram-style display
  const flattenReplies = (replies: Comment[] | undefined): Comment[] => {
    if (!replies?.length) return [];
    const flat: Comment[] = [];
    for (const r of replies) {
      flat.push(r);
      if (r.replies?.length) flat.push(...flattenReplies(r.replies));
    }
    return flat;
  };

  // ─── Loading state ───

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-200 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-surface-200 rounded w-32" />
              <div className="h-3 bg-surface-100 rounded w-20" />
            </div>
          </div>
          <div className="h-6 bg-surface-200 rounded w-3/4" />
          <div className="h-48 bg-surface-100 rounded-xl" />
          <div className="h-20 bg-surface-100 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── Error state ───

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl">
          <h2 className="text-xl font-semibold mb-2">Post não encontrado</h2>
          <p className="text-sm mb-4">{error || 'Este post não existe ou foi removido.'}</p>
          <Button onClick={() => router.push('/')}>Voltar para o Feed</Button>
        </div>
      </div>
    );
  }

  const author = post.author || { id: post.user_id, full_name: 'Usuário', avatar_url: null, is_creator: false, member_number: null };
  const mediaType = (post as unknown as Record<string, unknown>).media_type as string || 'none';
  const youtubeUrl = (post as unknown as Record<string, unknown>).youtube_url as string | null;
  const instagramUrl = (post as unknown as Record<string, unknown>).instagram_url as string | null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-surface-500 hover:text-surface-700 mb-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <article className="bg-white border border-surface-200 rounded-2xl shadow-soft overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Link href={`/profile/${author.id}`} className="shrink-0">
            <Avatar name={author.full_name || 'Usuário'} src={author.avatar_url || undefined} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${author.id}`} className="font-semibold text-surface-900 hover:text-primary-600 transition-colors text-[15px]">
                {author.full_name || 'Usuário'}
              </Link>
              <MemberBadge memberNumber={author.member_number} />
            </div>
            <time className="text-xs text-surface-400" dateTime={post.created_at}>
              {formatRelativeTime(post.created_at)}
            </time>
          </div>

          {/* Share */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="p-2 rounded-full text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
            </svg>
          </button>
        </div>

        {/* ── Title ── */}
        {post.title && (
          <div className="px-4 pb-2">
            <h1 className="text-xl font-bold text-surface-900">{post.title}</h1>
          </div>
        )}

        {/* ── Full Content ── */}
        {post.content && (
          <div className="px-4 pb-4">
            <div
              className="text-[15px] text-surface-700 leading-relaxed whitespace-pre-line break-words [&_a]:text-primary-600 [&_a]:underline [&_a:hover]:text-primary-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          </div>
        )}

        {/* ── Media ── */}
        {post.media_url && post.media_url.length > 0 && (mediaType === 'image' || mediaType === 'carousel' || mediaType === 'none') && (
          <div className="w-full">
            <ImageCarousel images={post.media_url} alt={post.title} />
          </div>
        )}

        {post.media_url && post.media_url.length > 0 && mediaType === 'video' && (
          <div className="w-full">
            <video src={post.media_url[0]} controls className="w-full max-h-[500px] object-contain bg-black" preload="metadata" />
          </div>
        )}

        {youtubeUrl && mediaType === 'youtube' && (
          <div className="px-4 pb-4">
            <YouTubeEmbed url={youtubeUrl} title={post.title} />
          </div>
        )}

        {instagramUrl && mediaType === 'instagram' && (
          <div className="px-4 pb-4">
            <InstagramEmbed url={instagramUrl} />
          </div>
        )}

        {/* ── Action Bar ── */}
        <div className="px-4 py-3 border-t border-surface-100 flex items-center gap-5">
          <LikeButton
            postId={post.id}
            initialCount={post.likes_count || 0}
            initialLiked={typeof userVote === 'number' && userVote > 0}
          />
          <div className="flex items-center gap-1.5 text-surface-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-sm font-semibold tabular-nums">{comments.length}</span>
          </div>
        </div>

        {/* ── Comments Section ── */}
        <div className="border-t border-surface-100 px-4 py-4">
          <h3 className="font-semibold text-surface-900 text-sm mb-4">Comentários</h3>

          {comments.length === 0 ? (
            <p className="text-sm text-surface-400 text-center py-4">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onReply={handleReply}
                    onLike={handleLikeComment}
                  />
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {flattenReplies(comment.replies).map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onReply={handleReply}
                          onLike={handleLikeComment}
                          isReply
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg">
              <span>Respondendo a <strong>{replyingTo.name}</strong></span>
              <button
                onClick={() => { setReplyingTo(null); setNewComment(''); }}
                className="ml-auto text-surface-400 hover:text-surface-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* New comment form */}
          <form onSubmit={handleSubmitComment} className="flex items-center gap-3 pt-2 border-t border-surface-100">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Responder a ${replyingTo.name}...` : 'Adicione um comentário...'}
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-surface-300 text-surface-700 py-2"
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
      </article>
    </div>
  );
}
