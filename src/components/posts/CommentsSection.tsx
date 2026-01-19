'use client';

import { useState, useTransition, useEffect } from 'react';
import { Avatar, Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { commentPost, getPostComments } from '@/actions/posts';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  initialComments?: Comment[];
  commentsCount: number;
  defaultExpanded?: boolean;
}

// Componente para um único comentário (estilo Instagram - só 1 nível de indentação)
function CommentItem({
  comment,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  onReply: (parentId: string, authorName: string) => void;
  isReply?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Avatar
        name={comment.author?.full_name || 'Usuário'}
        src={comment.author?.avatar_url || undefined}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold text-sm text-gray-900">
            {comment.author?.full_name || 'Usuário'}
          </span>
          <span className="text-sm text-gray-700 break-words">{comment.content}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(comment.created_at)}
          </span>
          <button
            onClick={() => onReply(comment.id, comment.author?.full_name || 'Usuário')}
            className="text-xs font-medium text-gray-500 hover:text-indigo-600"
          >
            Responder
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommentsSection({
  postId,
  initialComments = [],
  commentsCount,
  defaultExpanded = false,
}: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carregar comentários quando expandido
  useEffect(() => {
    if (isExpanded && comments.length === 0 && commentsCount > 0) {
      setIsLoading(true);
      getPostComments(postId).then((data) => {
        setComments(data as Comment[]);
        setIsLoading(false);
      });
    }
  }, [postId, commentsCount, comments.length, isExpanded]);

  const toggleComments = () => {
    setIsExpanded(!isExpanded);
  };

  const handleReply = (parentId: string, authorName: string) => {
    setReplyingTo({ id: parentId, name: authorName });
    setNewComment(`@${authorName} `);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const content = newComment;
    const parentId = replyingTo?.id;
    setNewComment('');
    setReplyingTo(null);

    startTransition(async () => {
      const result = await commentPost(postId, content, parentId);
      if (result.success && result.data) {
        // Recarregar comentários
        const data = await getPostComments(postId);
        setComments(data as Comment[]);
      }
    });
  };

  // Flatten replies para mostrar estilo Instagram (todas as respostas no mesmo nível)
  const flattenReplies = (replies: Comment[] | undefined): Comment[] => {
    if (!replies || replies.length === 0) return [];

    const flattened: Comment[] = [];
    for (const reply of replies) {
      flattened.push(reply);
      // Recursivamente pegar respostas das respostas (mas todas ficam no mesmo nível visual)
      if (reply.replies && reply.replies.length > 0) {
        flattened.push(...flattenReplies(reply.replies));
      }
    }
    return flattened;
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
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id}>
                  {/* Comentário principal */}
                  <CommentItem
                    comment={comment}
                    onReply={handleReply}
                    isReply={false}
                  />

                  {/* Respostas (todas no mesmo nível - estilo Instagram) */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {flattenReplies(comment.replies).map((reply) => (
                        <CommentItem
                          key={reply.id}
                          comment={reply}
                          onReply={handleReply}
                          isReply={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500 text-sm">
              Nenhum comentário ainda. Seja o primeiro!
            </div>
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
              <span>Respondendo a <strong>{replyingTo.name}</strong></span>
              <button
                onClick={cancelReply}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* New comment form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? `Responder a ${replyingTo.name}...` : 'Escreva um comentário...'}
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
