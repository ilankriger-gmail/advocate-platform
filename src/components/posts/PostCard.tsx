'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { formatRelativeTime, cn } from '@/lib/utils';
import { POST_STATUS } from '@/lib/constants';
import { usePosts } from '@/hooks';
import type { PostWithAuthor } from '@/types/post';

interface PostCardProps {
  post: PostWithAuthor;
  isLiked?: boolean;
  isOwner?: boolean;
  isAdmin?: boolean;
  compact?: boolean;
}

export function PostCard({
  post,
  isLiked: initialIsLiked = false,
  isOwner = false,
  isAdmin = false,
  compact = false,
}: PostCardProps) {
  const { like, approve, reject, delete: deletePost, isPending } = usePosts();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const statusConfig = POST_STATUS[post.status];

  const handleLike = async () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    await like(post.id);
  };

  const handleApprove = async () => {
    await approve(post.id);
  };

  const handleReject = async () => {
    const reason = prompt('Motivo da rejeição:');
    if (reason) {
      await reject(post.id, reason);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja deletar este post?')) {
      await deletePost(post.id);
    }
  };

  const author = post.author || { id: post.user_id, full_name: 'Usuário', avatar_url: null };

  // Modo compacto - versão simplificada
  if (compact) {
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <Avatar
          name={author.full_name || 'Usuário'}
          src={author.avatar_url || undefined}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
          <p className="text-sm text-gray-500 truncate">{post.content}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>{formatRelativeTime(post.created_at)}</span>
            {post.status !== 'approved' && (
              <Badge variant={post.status === 'pending' ? 'warning' : 'error'} size="sm">
                {statusConfig.label}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {likesCount}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${author.id}`}>
            <Avatar
              name={author.full_name || 'Usuário'}
              src={author.avatar_url || undefined}
              size="md"
            />
          </Link>
          <div>
            <Link
              href={`/profile/${author.id}`}
              className="font-medium text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {author.full_name || 'Usuário'}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.status !== 'approved' && (
                <Badge
                  variant={post.status === 'pending' ? 'warning' : 'error'}
                  size="sm"
                >
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Menu de opções */}
        {(isOwner || isAdmin) && (
          <div className="relative group">
            <button className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {post.title}
        </h3>
        {post.content && (
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Media */}
      {post.media_url && post.media_url.length > 0 && (
        <div className="px-4 pb-4">
          {post.media_url.length === 1 ? (
            <img
              src={post.media_url[0]}
              alt="Mídia do post"
              className="w-full rounded-lg object-cover max-h-96"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {post.media_url.slice(0, 4).map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Mídia ${index + 1}`}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection reason */}
      {post.status === 'rejected' && post.rejection_reason && (
        <div className="mx-4 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">
            <span className="font-medium">Motivo da rejeição:</span>{' '}
            {post.rejection_reason}
          </p>
        </div>
      )}

      {/* Actions */}
      {post.status === 'approved' && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-2 text-sm transition-colors',
              isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            )}
          >
            <svg
              className="w-5 h-5"
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
            <span>{likesCount}</span>
          </button>

          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{post.comments_count || 0}</span>
          </button>
        </div>
      )}

      {/* Approval Actions (admin only, pending posts) */}
      {isAdmin && post.status === 'pending' && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleApprove}
            isLoading={isPending}
          >
            Aprovar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleReject}
            isLoading={isPending}
          >
            Rejeitar
          </Button>
        </div>
      )}
    </Card>
  );
}
