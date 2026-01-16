'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { formatRelativeTime } from '@/lib/utils';
import { getPostWithDetails } from '@/actions/posts';
import ImageCarousel from '@/components/posts/ImageCarousel';
import YouTubeEmbed from '@/components/posts/YouTubeEmbed';
import InstagramEmbed from '@/components/posts/InstagramEmbed';
import { VoteButtons } from '@/components/posts/VoteButtons';
import { CommentsSection } from '@/components/posts/CommentsSection';
import type { PostWithAuthor } from '@/types/post';

// Função para limpar HTML
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 's', 'strike'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPost() {
      if (!postId) return;

      setIsLoading(true);
      const result = await getPostWithDetails(postId);

      if (result.error || !result.data) {
        setError(result.error || 'Post não encontrado');
        setIsLoading(false);
        return;
      }

      setPost(result.data.post as PostWithAuthor);
      setUserVote(result.data.userVote);
      setIsLoading(false);
    }

    loadPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="h-64 bg-gray-200 rounded mb-4" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-2">Post não encontrado</h2>
          <p className="text-sm mb-4">{error || 'Este post não existe ou foi removido.'}</p>
          <Button onClick={() => router.push('/')}>Voltar para o Feed</Button>
        </div>
      </div>
    );
  }

  const author = post.author || { id: post.user_id, full_name: 'Usuário', avatar_url: null, is_creator: false };
  const voteScore = (post as unknown as Record<string, unknown>).vote_score as number || 0;
  const mediaType = (post as unknown as Record<string, unknown>).media_type as string || 'none';
  const youtubeUrl = (post as unknown as Record<string, unknown>).youtube_url as string | null;
  const instagramUrl = (post as unknown as Record<string, unknown>).instagram_url as string | null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Botão Voltar */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-surface-500 hover:text-surface-700 mb-4 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

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
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${author.id}`}
                  className="font-medium text-surface-900 hover:text-primary-600 transition-colors"
                >
                  {author.full_name || 'Usuário'}
                </Link>
                {author.is_creator && (
                  <Badge variant="primary" size="sm">Criador</Badge>
                )}
              </div>
              <p className="text-sm text-surface-500">
                {formatRelativeTime(post.created_at)}
              </p>
            </div>
          </div>

          {/* Botão Compartilhar */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copiado!');
              }
            }}
            className="p-2 rounded-full text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
            title="Compartilhar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Título */}
        <div className="px-4 pb-2">
          <h1 className="text-xl font-bold text-surface-900">
            {post.title}
          </h1>
        </div>

        {/* Conteúdo completo */}
        {post.content && (
          <div className="px-4 pb-4">
            <div
              className="prose prose-sm max-w-none text-surface-700 whitespace-pre-line [&_a]:text-primary-600 [&_a]:underline [&_a:hover]:text-primary-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />
          </div>
        )}

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

        {/* Actions - Votos */}
        <div className="px-4 py-3 border-t border-surface-100 flex items-center gap-6">
          <VoteButtons
            postId={post.id}
            initialScore={voteScore}
            initialUserVote={userVote}
            vertical={false}
          />
        </div>

        {/* Comments Section - Expandido por padrão */}
        <CommentsSection
          postId={post.id}
          commentsCount={post.comments_count || 0}
          defaultExpanded={true}
        />
      </Card>
    </div>
  );
}
