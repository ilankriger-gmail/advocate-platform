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
import { SentimentThermometer } from './SentimentThermometer';
import { TeAmoButton, ExplodingHeart } from './TeAmoButton';
import { CommentsSection } from './CommentsSection';
import type { PostWithAuthor } from '@/types/post';

// Componente que integra ações e comentários
function PostActionsWithComments({ 
  post, 
  userVote 
}: { 
  post: PostWithAuthor; 
  userVote?: number | null;
}) {
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  return (
    <>
      <div className="px-4 py-3 border-t border-surface-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TeAmoButton
            postId={post.id}
            initialCount={post.likes_count || 0}
            initialLiked={typeof userVote === 'number' && userVote > 0}
          />
          
          {/* Contador de comentários clicável */}
          <button
            onClick={() => setCommentsExpanded(!commentsExpanded)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-primary-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-sm font-medium">
              {post.comments_count || 0} {(post.comments_count || 0) === 1 ? 'comentário' : 'comentários'}
            </span>
          </button>
        </div>

        {/* Ícones de ação (bookmark, share) */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Comments Section - controlado pelo estado */}
      <CommentsSection
        postId={post.id}
        commentsCount={post.comments_count || 0}
        defaultExpanded={commentsExpanded}
      />
    </>
  );
}

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

// Função para truncar texto HTML preservando tags
function truncateHtml(html: string, maxLength: number): { truncated: string; wasTruncated: boolean } {
  const plainText = stripHtml(html);

  if (plainText.length <= maxLength) {
    return { truncated: html, wasTruncated: false };
  }

  // Truncar pelo texto puro e adicionar reticências
  let charCount = 0;
  let result = '';
  let inTag = false;
  let tagBuffer = '';

  for (let i = 0; i < html.length; i++) {
    const char = html[i];

    if (char === '<') {
      inTag = true;
      tagBuffer = '<';
      continue;
    }

    if (inTag) {
      tagBuffer += char;
      if (char === '>') {
        inTag = false;
        result += tagBuffer;
        tagBuffer = '';
      }
      continue;
    }

    if (charCount < maxLength) {
      result += char;
      charCount++;
    } else {
      // Chegou no limite, adicionar reticências
      result += '...';
      break;
    }
  }

  // Fechar tags abertas (simplificado)
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-z]+)[^>]*>/gi;
  let match;

  while ((match = tagRegex.exec(result)) !== null) {
    const isClosing = match[0].startsWith('</');
    const tagName = match[1].toLowerCase();

    if (isClosing) {
      const idx = openTags.lastIndexOf(tagName);
      if (idx !== -1) openTags.splice(idx, 1);
    } else if (!match[0].endsWith('/>')) {
      openTags.push(tagName);
    }
  }

  // Fechar tags abertas na ordem inversa
  for (let i = openTags.length - 1; i >= 0; i--) {
    result += `</${openTags[i]}>`;
  }

  return { truncated: result, wasTruncated: true };
}

// Memoizado para evitar re-renders desnecessários em listas
// Limite de caracteres para truncar conteúdo
const CONTENT_TRUNCATE_LIMIT = 300;

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
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const statusConfig = POST_STATUS[post.status];
  const voteAverage = (post as unknown as Record<string, unknown>).vote_average as number || 0;
  const voteCount = (post as unknown as Record<string, unknown>).vote_count as number || 0;

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
        <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors">
          <Link href={`/profile/${author.id}`}>
            <Avatar
              name={author.full_name || 'Usuário'}
              src={author.avatar_url || undefined}
              size="sm"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${author.id}`}
              className="font-medium text-surface-900 hover:text-primary-600 transition-colors"
            >
              {author.full_name || 'Usuário'}
            </Link>
            <h4 className="font-medium text-surface-900 truncate">{post.title}</h4>
            <p className="text-sm text-surface-500 truncate">{textContent}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.status !== 'approved' && (
                <Badge variant={post.status === 'pending' ? 'warning' : 'error'} size="sm">
                  {statusConfig.label}
                </Badge>
              )}
              <SentimentThermometer
                postId={post.id}
                averageScore={voteAverage}
                totalVotes={voteCount}
                userVote={userVote}
                compact
              />
              {isOwner && (
                <>
                  <Link
                    href={`/perfil/posts/${post.id}/editar`}
                    className="text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
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
    <Card className="overflow-hidden hover-lift animate-fade-in">
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
              className="font-medium text-surface-900 hover:text-primary-600 transition-colors"
            >
              {author.full_name || 'Usuário'}
            </Link>
            <div className="flex items-center gap-2 text-sm text-surface-500">
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
            <button className="p-1.5 rounded-full text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-surface-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {isOwner && (
                <>
                  <Link
                    href={`/perfil/posts/${post.id}/editar`}
                    className="block w-full text-left px-3 py-1.5 text-sm text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
        <Link href={`/post/${post.id}`}>
          <h3 className="text-lg font-semibold text-surface-900 mb-2 hover:text-primary-600 transition-colors cursor-pointer">
            {post.title}
          </h3>
        </Link>
        {post.content && (() => {
          const { truncated, wasTruncated } = truncateHtml(post.content, CONTENT_TRUNCATE_LIMIT);
          const displayContent = isContentExpanded ? post.content : truncated;

          return (
            <>
              <div
                className="prose prose-sm max-w-none text-surface-700 whitespace-pre-line [&_a]:text-primary-600 [&_a]:underline [&_a:hover]:text-primary-800"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
              />
              {wasTruncated && (
                <button
                  onClick={() => setIsContentExpanded(!isContentExpanded)}
                  className="block mt-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                >
                  {isContentExpanded ? 'Ver menos ↑' : 'Ver mais →'}
                </button>
              )}
            </>
          );
        })()}
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
        <PostActionsWithComments
          post={post}
          userVote={userVote}
        />
      )}

      {/* Approval Actions (admin only, pending posts) */}
      {isAdmin && post.status === 'pending' && (
        <div className="px-4 py-3 border-t border-surface-100 flex items-center gap-3 bg-gradient-to-r from-primary-50/50 to-accent-50/50">
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
