'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { approveBlockedPost, rejectPost } from '@/actions/posts';
import type { Post } from '@/lib/supabase/types';

interface ModerationCardProps {
  post: Post & {
    moderation_score?: number | null;
    moderation_flags?: Record<string, unknown> | null;
  };
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  filter: 'blocked' | 'help_request' | 'pending';
}

export function ModerationCard({ post, author, filter }: ModerationCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approveBlockedPost(post.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    setIsLoading(true);
    const result = await rejectPost(post.id, 'Conteudo inadequado confirmado pela moderacao manual');
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const blockedReasons = (post.moderation_flags as { blocked_reasons?: string[] })?.blocked_reasons || [];
  const imageFlags = (post.moderation_flags as { image?: Record<string, number> })?.image;
  const toxicityFlags = (post.moderation_flags as { toxicity?: Record<string, number> })?.toxicity;

  const getStatusBadge = () => {
    if (filter === 'blocked') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Bloqueado</span>;
    }
    if (filter === 'help_request') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Pedido de Ajuda</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Pendente</span>;
  };

  const getScoreBadge = () => {
    if (post.moderation_score === null || post.moderation_score === undefined) return null;
    const score = post.moderation_score;
    let colorClass = 'bg-green-100 text-green-700';
    if (score >= 0.7) colorClass = 'bg-red-100 text-red-700';
    else if (score >= 0.3) colorClass = 'bg-yellow-100 text-yellow-700';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
        Score: {(score * 100).toFixed(0)}%
      </span>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.full_name || 'Usuario'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">
                  {(author?.full_name || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">{author?.full_name || 'Usuario'}</p>
              <p className="text-xs text-gray-500">{author?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {getScoreBadge()}
          </div>
        </div>

        <div className="mb-4">
          {post.title && <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>}
          {post.content && (
            <p className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-4">{post.content}</p>
          )}
        </div>

        {post.media_url && Array.isArray(post.media_url) && post.media_url.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {post.media_url.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Midia ${idx + 1}`}
                className="h-24 w-24 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        )}

        {filter === 'blocked' && blockedReasons.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Motivos do bloqueio:</p>
            <ul className="text-sm text-red-700 list-disc list-inside">
              {blockedReasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {(imageFlags || toxicityFlags) && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              {showDetails ? 'Ocultar' : 'Ver'} detalhes da moderacao
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                {imageFlags && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Analise de Imagem:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(imageFlags).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className={(value as number) >= 0.5 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {((value as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {toxicityFlags && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Analise de Toxicidade:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(toxicityFlags).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className={(value as number) >= 0.5 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                            {((value as number) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mb-4">
          Criado em {new Date(post.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {(filter === 'blocked' || filter === 'pending') && (
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={isLoading} variant="primary" size="sm">
              {isLoading ? 'Processando...' : 'Aprovar'}
            </Button>
            <Button onClick={handleReject} disabled={isLoading} variant="outline" size="sm">
              {filter === 'blocked' ? 'Manter Bloqueado' : 'Rejeitar'}
            </Button>
          </div>
        )}

        {filter === 'help_request' && (
          <div className="text-xs text-gray-500 italic">
            Este post esta visivel na aba Pedidos de Ajuda do feed.
          </div>
        )}
      </div>
    </Card>
  );
}
