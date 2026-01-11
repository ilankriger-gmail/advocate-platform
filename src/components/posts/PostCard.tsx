'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Card, Avatar, Badge, Button, ConfirmModal, PromptModal } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { POST_STATUS } from '@/lib/constants';
import { usePosts } from '@/hooks';
import ImageCarousel from './ImageCarousel';
import YouTubeEmbed from './YouTubeEmbed';
import InstagramEmbed from './InstagramEmbed';
import { VoteButtons } from './VoteButtons';
import { CommentsSection } from './CommentsSection';
import type { PostWithAuthor } from '@/types/post';

interface PostCardProps {
  post: PostWithAuthor;
  userVote?: number | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  compact?: boolean;
}

// Função para limpar HTML e manter apenas tags seguras
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

// Função para extrair texto puro do HTML (para preview compacto)
function stripHtml(html: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  // Fallback simples para SSR
  return html.replace(/<[^>]*>/g, '');
}

// Memoizado para evitar re-renders desnecessários em listas
export const PostCard = memo(function PostCard({
  post,
  userVote = null,
  isOwner = false,
  isAdmin = false,
  compact = false,
}: PostCardProps) {
  const { approve, reject, delete: deletePost, isPending } = usePosts();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const statusConfig = POST_STATUS[post.status];
  const voteScore = (post as unknown as Record<string, unknown>).vote_score as number || 0;

  const handleApprove = async () => {
    await approve(post.id);
  };

  const handleReject = () => {
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    await reject(post.id, reason);
    setIsRejectModalOpen(false);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    await deletePost(post.id);
    setIsDeleteModalOpen(false);
  };

  const author = post.author || { id: post.user_id, full_name: 'Usuário', avatar_url: null };

  // Determinar tipo de mídia do post
  const mediaType = (post as unknown as Record<string, unknown>).media_type as string || 'none';
  const youtubeUrl = (post as unknown as Record<string, unknown>).youtube_url as string | null;
  const instagramUrl = (post as unknown as Record<string, unknown>).instagram_url as string | null;

  // Modo compacto - versão simplificada
  if (compact) {
    const textContent = post.content ? stripHtml(post.content) : '';

    return (
      <>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <Avatar
            name={author.full_name || 'Usuário'}
            src={author.avatar_url || undefined}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
            <p className="text-sm text-gray-500 truncate">{textContent}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.status !== 'approved' && (
                <Badge variant={post.status === 'pending' ? 'warning' : 'error'} size="sm">
                  {statusConfig.label}
                </Badge>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                {voteScore}
              </span>
              {isOwner && (
                <>
                  <Link
                    href={`/perfil/posts/${post.id}/editar`}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Excluir post"
          description="Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita."
          variant="danger"
          confirmText="Excluir"
          cancelText="Cancelar"
        />

        {/* Reject Reason Modal */}
        <PromptModal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          onSubmit={handleConfirmReject}
          title="Rejeitar post"
          description="Informe o motivo da rejeição. Esta informação será enviada ao autor."
          placeholder="Digite o motivo da rejeição..."
          required
          submitText="Rejeitar"
          cancelText="Cancelar"
        />
      </>
    );
  }

  return (
    <>
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
                <>
                  <Link
                    href={`/perfil/posts/${post.id}/editar`}
                    className="block w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                </>
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
          <div
            className="prose prose-sm max-w-none text-gray-700 [&_a]:text-purple-600 [&_a]:underline [&_a:hover]:text-purple-800"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />
        )}
      </div>

      {/* Media - Imagens/Carrossel */}
      {post.media_url && post.media_url.length > 0 && (mediaType === 'image' || mediaType === 'carousel' || mediaType === 'none') && (
        <div className="px-4 pb-4">
          <ImageCarousel images={post.media_url} alt={post.title} />
        </div>
      )}

      {/* Media - YouTube Embed */}
      {youtubeUrl && mediaType === 'youtube' && (
        <div className="px-4 pb-4">
          <YouTubeEmbed url={youtubeUrl} title={post.title} />
        </div>
      )}

      {/* Media - Instagram Embed */}
      {instagramUrl && mediaType === 'instagram' && (
        <div className="px-4 pb-4">
          <InstagramEmbed url={instagramUrl} />
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
        <>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
            <VoteButtons
              postId={post.id}
              initialScore={voteScore}
              initialUserVote={userVote}
              vertical={false}
            />
          </div>

          {/* Comments Section */}
          <CommentsSection
            postId={post.id}
            commentsCount={post.comments_count || 0}
          />
        </>
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

    {/* Delete Confirmation Modal */}
    <ConfirmModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleConfirmDelete}
      title="Excluir post"
      description="Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita."
      variant="danger"
      confirmText="Excluir"
      cancelText="Cancelar"
    />

    {/* Reject Reason Modal */}
    <PromptModal
      isOpen={isRejectModalOpen}
      onClose={() => setIsRejectModalOpen(false)}
      onSubmit={handleConfirmReject}
      title="Rejeitar post"
      description="Informe o motivo da rejeição. Esta informação será enviada ao autor."
      placeholder="Digite o motivo da rejeição..."
      required
      submitText="Rejeitar"
      cancelText="Cancelar"
    />
  </>
  );
});
