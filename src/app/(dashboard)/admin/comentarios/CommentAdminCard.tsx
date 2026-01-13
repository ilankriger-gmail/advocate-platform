'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { deleteCommentAdmin } from '@/actions/comments-admin';

interface CommentAdminCardProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    is_deleted: boolean;
  };
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    instagram_username: string | null;
  } | null;
  post: {
    id: string;
    content: string | null;
    media_url: string[] | null;
  } | null;
}

export function CommentAdminCard({ comment, author, post }: CommentAdminCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteCommentAdmin(comment.id);

    if (result.error) {
      alert(result.error);
      setIsDeleting(false);
      return;
    }

    setIsDeleted(true);
  };

  if (isDeleted) {
    return null;
  }

  const createdAt = new Date(comment.created_at);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        {/* Avatar do autor */}
        <div className="flex-shrink-0">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.full_name || 'Autor'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {author?.full_name?.[0] || '?'}
              </span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">
              {author?.full_name || 'Usuário'}
            </span>
            {author?.instagram_username && (
              <span className="text-xs text-gray-500">
                @{author.instagram_username}
              </span>
            )}
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>

          {/* Comentário */}
          <p className="text-gray-700 text-sm mb-2 whitespace-pre-line">
            {comment.content}
          </p>

          {/* Post relacionado */}
          {post && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-2">
              {post.media_url && post.media_url.length > 0 && (
                <img
                  src={post.media_url[0]}
                  alt="Post"
                  className="w-10 h-10 rounded object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 truncate">
                  Comentou no post: {post.content?.slice(0, 50)}...
                </p>
              </div>
              <Link
                href={`/feed?post=${post.id}`}
                className="text-xs text-blue-600 hover:underline whitespace-nowrap"
              >
                Ver post
              </Link>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : '🗑️ Excluir'}
            </Button>
            {author && (
              <Link href={`/admin/usuarios?search=${author.id}`}>
                <Button size="sm" variant="outline">
                  👤 Ver usuário
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins}min`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
