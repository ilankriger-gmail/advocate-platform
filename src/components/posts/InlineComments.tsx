'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { commentPost, getPostComments } from '@/actions/posts';

interface CommentPreview {
  id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface InlineCommentsProps {
  postId: string;
  commentsCount: number;
}

/**
 * Inline comments shown at the bottom of PostCard.
 * Shows preview of last 2 comments + input to add a new comment.
 */
export function InlineComments({ postId, commentsCount }: InlineCommentsProps) {
  const [comments, setComments] = useState<CommentPreview[]>([]);
  const [localCount, setLocalCount] = useState(commentsCount);
  const [newComment, setNewComment] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load preview comments (last 2)
  useEffect(() => {
    if (commentsCount === 0) return;
    let cancelled = false;

    getPostComments(postId).then((data) => {
      if (cancelled) return;
      // Get last 2 top-level comments
      const topLevel = (data as CommentPreview[]).filter(
        (c: CommentPreview & { parent_id?: string | null }) => !c.parent_id
      );
      setComments(topLevel.slice(-2));
      setLocalCount(topLevel.length);
      setLoaded(true);
    });

    return () => { cancelled = true; };
  }, [postId, commentsCount]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = newComment.trim();
      if (!text) return;
      setNewComment('');

      startTransition(async () => {
        const result = await commentPost(postId, text);
        if (result.success) {
          // Reload comments
          const data = await getPostComments(postId);
          const topLevel = (data as CommentPreview[]).filter(
            (c: CommentPreview & { parent_id?: string | null }) => !c.parent_id
          );
          setComments(topLevel.slice(-2));
          setLocalCount(topLevel.length);
        }
      });
    },
    [newComment, postId, startTransition],
  );

  return (
    <div className="px-4 pb-3">
      {/* "View all comments" link */}
      {localCount > 2 && (
        <Link
          href={`/post/${postId}`}
          className="block text-sm text-surface-400 hover:text-surface-600 transition-colors mb-2"
        >
          Ver todos os {localCount} comentários
        </Link>
      )}

      {/* Preview of last 2 comments */}
      {comments.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 text-[14px]">
              <Link
                href={`/profile/${comment.author?.id || ''}`}
                className="font-semibold text-surface-900 hover:text-primary-600 transition-colors shrink-0"
              >
                {comment.author?.full_name || 'Usuário'}
              </Link>
              <span className="text-surface-600 break-words min-w-0 line-clamp-2">
                {comment.content}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Inline comment input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicione um comentário..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-surface-300 text-surface-700 py-1"
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
  );
}
