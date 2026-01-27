'use client';

import { useState, memo, useCallback, useTransition } from 'react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Avatar, Badge, Button, ConfirmModal, PromptModal, MemberBadge } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { POST_STATUS } from '@/lib/constants';
import { usePosts } from '@/hooks';
import ImageCarousel from './ImageCarousel';
import YouTubeEmbed from './YouTubeEmbed';
import InstagramEmbed from './InstagramEmbed';
import { LikeButton } from './LikeButton';
import { InlineComments } from './InlineComments';
import type { PostWithAuthor } from '@/types/post';

// ─── Helpers ────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

function stripHtml(html: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  return html.replace(/<[^>]*>/g, '');
}

const MAX_CHARS = 200;

function truncateContent(html: string): { text: string; truncated: boolean } {
  const plain = stripHtml(html);
  if (plain.length <= MAX_CHARS) {
    return { text: plain, truncated: false };
  }
  return { text: plain.slice(0, MAX_CHARS).trimEnd() + '…', truncated: true };
}

// ─── Props ──────────────────────────────────────────────────

interface PostCardProps {
  post: PostWithAuthor;
  userVote?: number | null;
  isOwner?: boolean;
  isAdmin?: boolean;
  compact?: boolean;
}

// ─── PostCard ───────────────────────────────────────────────

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
  const [showFullContent, setShowFullContent] = useState(false);

  const statusConfig = POST_STATUS[post.status];
  const author = post.author || {
    id: post.user_id,
    full_name: 'Usuário',
    avatar_url: null,
    is_creator: false,
    member_number: null,
  };

  const mediaType = (post as unknown as Record<string, unknown>).media_type as string || 'none';
  const youtubeUrl = (post as unknown as Record<string, unknown>).youtube_url as string | null;
  const instagramUrl = (post as unknown as Record<string, unknown>).instagram_url as string | null;
  const hasImages = post.media_url && post.media_url.length > 0 && (mediaType === 'image' || mediaType === 'carousel' || mediaType === 'none');
  const hasVideo = post.media_url && post.media_url.length > 0 && mediaType === 'video';
  const hasYoutube = youtubeUrl && mediaType === 'youtube';
  const hasInstagram = instagramUrl && mediaType === 'instagram';
  const hasMedia = hasImages || hasVideo || hasYoutube || hasInstagram;

  // Content truncation
  const contentResult = post.content ? truncateContent(post.content) : null;

  // ─── Compact mode ───

  if (compact) {
    const textContent = post.content ? stripHtml(post.content) : '';
    return (
      <>
        <div className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors">
          <Link href={`/profile/${author.id}`}>
            <Avatar name={author.full_name || 'Usuário'} src={author.avatar_url || undefined} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              <Link href={`/profile/${author.id}`} className="font-medium text-surface-900 hover:text-primary-600 transition-colors">
                {author.full_name || 'Usuário'}
              </Link>
              <MemberBadge memberNumber={author.member_number} />
            </span>
            <h4 className="font-medium text-surface-900 truncate">{post.title}</h4>
            <p className="text-sm text-surface-500 truncate">{textContent}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-surface-400">
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.status !== 'approved' && (
                <Badge variant={post.status === 'pending' ? 'warning' : 'error'} size="sm">
                  {statusConfig.label}
                </Badge>
              )}
              {isOwner && (
                <>
                  <Link href={`/perfil/posts/${post.id}/editar`} className="text-primary-600 hover:text-primary-800 transition-colors">Editar</Link>
                  <button onClick={() => setIsDeleteModalOpen(true)} disabled={isPending} className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">Excluir</button>
                </>
              )}
            </div>
          </div>
        </div>
        <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={async () => { await deletePost(post.id); setIsDeleteModalOpen(false); }} title="Excluir post" description="Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita." variant="danger" confirmText="Excluir" cancelText="Cancelar" />
        <PromptModal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} onSubmit={async (reason: string) => { await reject(post.id, reason); setIsRejectModalOpen(false); }} title="Rejeitar post" description="Informe o motivo da rejeição." placeholder="Digite o motivo da rejeição..." required submitText="Rejeitar" cancelText="Cancelar" />
      </>
    );
  }

  // ─── Full card ───

  return (
    <>
      <article className="bg-white border border-surface-200 rounded-2xl shadow-soft overflow-hidden animate-fade-in">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <Link href={`/profile/${author.id}`} className="shrink-0">
            <Avatar name={author.full_name || 'Usuário'} src={author.avatar_url || undefined} size="md" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${author.id}`} className="font-semibold text-surface-900 hover:text-primary-600 transition-colors text-[15px] truncate">
                {author.full_name || 'Usuário'}
              </Link>
              <MemberBadge memberNumber={author.member_number} />
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <time dateTime={post.created_at}>{formatRelativeTime(post.created_at)}</time>
              {post.status !== 'approved' && (
                <Badge variant={post.status === 'pending' ? 'warning' : 'error'} size="sm">
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Options menu */}
          {(isOwner || isAdmin) && (
            <div className="relative group">
              <button className="p-1.5 rounded-full text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-surface-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                {isOwner && (
                  <>
                    <Link href={`/perfil/posts/${post.id}/editar`} className="block px-3 py-2 text-sm text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                      Editar
                    </Link>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Title (if exists) ── */}
        {post.title && (
          <div className="px-4 pb-1">
            <Link href={`/post/${post.id}`}>
              <h3 className="font-bold text-surface-900 text-base leading-snug hover:text-primary-600 transition-colors cursor-pointer">
                {post.title}
              </h3>
            </Link>
          </div>
        )}

        {/* ── Text Content ── */}
        {contentResult && (
          <div className="px-4 pb-3">
            {showFullContent && post.content ? (
              <div
                className="text-[15px] text-surface-700 leading-relaxed whitespace-pre-line break-words [&_a]:text-primary-600 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
              />
            ) : (
              <p className="text-[15px] text-surface-700 leading-relaxed break-words">
                {contentResult.text}
              </p>
            )}
            {contentResult.truncated && !showFullContent && (
              <Link
                href={`/post/${post.id}`}
                className="text-sm font-semibold text-primary-600 hover:text-primary-700 mt-1 inline-block transition-colors"
              >
                ver mais
              </Link>
            )}
          </div>
        )}

        {/* ── Media ── */}
        {hasImages && post.media_url && (
          <div className="w-full">
            <ImageCarousel images={post.media_url} alt={post.title} />
          </div>
        )}

        {hasVideo && post.media_url && (
          <div className="w-full">
            <video
              src={post.media_url[0]}
              controls
              className="w-full max-h-[500px] object-contain bg-black"
              preload="metadata"
            />
          </div>
        )}

        {hasYoutube && youtubeUrl && (
          <div className="px-4 pb-3">
            <YouTubeEmbed url={youtubeUrl} title={post.title} />
          </div>
        )}

        {hasInstagram && instagramUrl && (
          <div className="px-4 pb-3">
            <InstagramEmbed url={instagramUrl} />
          </div>
        )}

        {/* ── Rejection reason ── */}
        {post.status === 'rejected' && post.rejection_reason && (
          <div className="mx-4 mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              <span className="font-medium">Motivo da rejeição:</span> {post.rejection_reason}
            </p>
          </div>
        )}

        {/* ── Action Bar (likes, comments, share) ── */}
        {post.status === 'approved' && (
          <div className="px-4 py-2.5 border-t border-surface-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <LikeButton
                  postId={post.id}
                  initialCount={post.likes_count || 0}
                  initialLiked={typeof userVote === 'number' && userVote > 0}
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

              {/* Share */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/post/${post.id}`;
                  if (navigator.share) {
                    navigator.share({ title: post.title, url });
                  } else {
                    navigator.clipboard.writeText(url);
                  }
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Compartilhar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Inline Comments Preview ── */}
        {post.status === 'approved' && (
          <InlineComments
            postId={post.id}
            commentsCount={post.comments_count || 0}
          />
        )}

        {/* ── Admin Approval Actions ── */}
        {isAdmin && post.status === 'pending' && (
          <div className="px-4 py-3 border-t border-surface-100 flex items-center gap-3 bg-gradient-to-r from-primary-50/50 to-accent-50/50">
            <Button variant="primary" size="sm" onClick={() => approve(post.id)} isLoading={isPending}>
              Aprovar
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsRejectModalOpen(true)} isLoading={isPending}>
              Rejeitar
            </Button>
          </div>
        )}
      </article>

      {/* Modals */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => { await deletePost(post.id); setIsDeleteModalOpen(false); }}
        title="Excluir post"
        description="Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita."
        variant="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
      <PromptModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onSubmit={async (reason: string) => { await reject(post.id, reason); setIsRejectModalOpen(false); }}
        title="Rejeitar post"
        description="Informe o motivo da rejeição."
        placeholder="Digite o motivo da rejeição..."
        required
        submitText="Rejeitar"
        cancelText="Cancelar"
      />
    </>
  );
});
