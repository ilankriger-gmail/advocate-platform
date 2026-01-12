'use client';

import { useState, useTransition, useEffect } from 'react';
import { Avatar, Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { commentPost, getPostComments } from '@/actions/posts';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentsSectionProps {
  postId: string;
  initialComments?: Comment[];
  commentsCount: number;
}

export function CommentsSection({
  postId,
  initialComments = [],
  commentsCount,
}: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carregar comentários automaticamente ao montar (já que começa expandido)
  useEffect(() => {
    if (comments.length === 0 && commentsCount > 0) {
      setIsLoading(true);
      getPostComments(postId).then((data) => {
        setComments(data as Comment[]);
        setIsLoading(false);
      });
    }
  }, [postId, commentsCount, comments.length]);

  const toggleComments = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const content = newComment;
    setNewComment('');

    startTransition(async () => {
      const result = await commentPost(postId, content);
      if (result.success && result.data) {
        // Recarregar comentários
        const data = await getPostComments(postId);
        setComments(data as Comment[]);
      }
    });
  };

  return (
    <div className="border-t border-gray-100">
      {/* Toggle button */}
      <button
        onClick={toggleComments}
        className="w-full px-4 py-2 text-sm text-gray-500 hover:text-indigo-600 hover:bg-gray-50 flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {isExpanded ? 'Ocultar comentários' : `Ver comentários (${commentsCount})`}
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Comments list */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="py-4 text-center text-gray-500 text-sm">
              Carregando comentários...
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    name={comment.author?.full_name || 'Usuário'}
                    src={comment.author?.avatar_url || undefined}
                    size="sm"
                  />
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.author?.full_name || 'Usuário'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 text-sm">
              Nenhum comentário ainda. Seja o primeiro!
            </div>
          )}

          {/* New comment form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isPending}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newComment.trim() || isPending}
            >
              {isPending ? '...' : 'Enviar'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
