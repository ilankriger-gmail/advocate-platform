'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { commentPost, getPostComments, likeComment } from '@/actions/posts';

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
  onLike,
  isReply = false,
}: {
  comment: Comment;
  onReply: (parentId: string, authorName: string) => void;
  onLike: (commentId: string) => void;
  isReply?: boolean;
}) {
  const authorId = comment.author?.id;
  const authorName = comment.author?.full_name || 'Usuário';
  const authorAvatar = comment.author?.avatar_url || undefined;
  const likesCount = comment.likes_count || 0;
  const isLiked = comment.is_liked_by_user || false;

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      {authorId ? (
        <Link href={`/profile/${authorId}`} className="flex-shrink-0">
          <Avatar
            name={authorName}
            src={authorAvatar}
            size="sm"
            className="hover:ring-2 hover:ring-indigo-300 transition-all"
          />
        </Link>
      ) : (
        <Avatar name={authorName} src={authorAvatar} size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {authorId ? (
            <Link
              href={`/profile/${authorId}`}
              className="font-semibold text-sm text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {authorName}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-gray-900">{authorName}</span>
          )}
          <span className="text-sm text-gray-700 break-words">{comment.content}</span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(comment.created_at)}
          </span>
          <button
            onClick={() => onLike(comment.id)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          <button
            onClick={() => onReply(comment.id, authorName)}
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
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Carregar comentários quando expandido
  useEffect(() => {
    if (isExpanded && comments.length === 0 && localCommentsCount > 0) {
      setIsLoading(true);
      getPostComments(postId).then((data) => {
        setComments(data as Comment[]);
        // Sincronizar contador com dados reais do servidor
        setLocalCommentsCount(data.length);
        setIsLoading(false);
      });
    }
  }, [postId, localCommentsCount, comments.length, isExpanded]);

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

  // Função auxiliar para atualizar likes em comentários aninhados
  const updateCommentLikes = (
    commentsList: Comment[],
    commentId: string,
    liked: boolean,
    likesCount: number
  ): Comment[] => {
    return commentsList.map((c) => {
      if (c.id === commentId) {
        return { ...c, is_liked_by_user: liked, likes_count: likesCount };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateCommentLikes(c.replies, commentId, liked, likesCount) };
      }
      return c;
    });
  };

  const handleLike = (commentId: string) => {
    // Encontrar o comentário para fazer optimistic update
    const findComment = (list: Comment[]): Comment | undefined => {
      for (const c of list) {
        if (c.id === commentId) return c;
        if (c.replies) {
          const found = findComment(c.replies);
          if (found) return found;
        }
      }
      return undefined;
    };

    const comment = findComment(comments);
    if (!comment) return;

    // Optimistic update
    const newLiked = !comment.is_liked_by_user;
    const newCount = (comment.likes_count || 0) + (newLiked ? 1 : -1);
    setComments((prev) => updateCommentLikes(prev, commentId, newLiked, newCount));

    // Chamar API
    startTransition(async () => {
      const result = await likeComment(commentId);
      if (result.success && result.data) {
        // Atualizar com dados reais do servidor
        setComments((prev) =>
          updateCommentLikes(prev, commentId, result.data!.liked, result.data!.likesCount)
        );
      }
    });
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
        // Atualizar contador local com total real
        setLocalCommentsCount(data.length);
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
        {isExpanded ? 'Ocultar comentários' : `Ver comentários (${localCommentsCount})`}
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
                    onLike={handleLike}
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
                          onLike={handleLike}
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
