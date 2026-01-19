'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button } from '@/components/ui';
import { approvePost, approveBlockedPost, rejectPost } from '@/actions/posts';
import type { Post } from '@/lib/supabase/types';

type FilterType = 'pending' | 'blocked' | 'help_request' | 'approved' | 'rejected';

interface UnifiedPostCardProps {
  post: Post & {
    moderation_score?: number | null;
    moderation_flags?: Record<string, unknown> | null;
    rejection_reason?: string | null;
    content_category?: string | null;
  };
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
  filter: FilterType;
}

export function UnifiedPostCard({ post, author, filter }: UnifiedPostCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    // Usa approveBlockedPost para posts bloqueados, approvePost para pendentes
    const result = filter === 'blocked'
      ? await approveBlockedPost(post.id)
      : await approvePost(post.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    const reason = rejectReason.trim() || 'Conteúdo inadequado confirmado pela moderação manual';
    setIsLoading(true);
    const result = await rejectPost(post.id, reason);
    if (result.success) {
      setShowRejectModal(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const blockedReasons = (post.moderation_flags as { blocked_reasons?: string[] })?.blocked_reasons || [];
  const imageFlags = (post.moderation_flags as { image?: Record<string, number> })?.image;
  const toxicityFlags = (post.moderation_flags as { toxicity?: Record<string, number> })?.toxicity;

  const getStatusBadge = () => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
      blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqueado' },
      help_request: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pedido de Ajuda' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprovado' },
      rejected: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Rejeitado' },
    };

    // Para help_request, mostra o status real do post também
    if (filter === 'help_request' && post.status !== 'approved') {
      const status = badges[post.status] || badges.pending;
      return (
        <div className="flex gap-2">
          <span className={`px-2 py-1 ${badges.help_request.bg} ${badges.help_request.text} text-xs font-medium rounded-full`}>
            Pedido de Ajuda
          </span>
          <span className={`px-2 py-1 ${status.bg} ${status.text} text-xs font-medium rounded-full`}>
            {status.label}
          </span>
        </div>
      );
    }

    const badge = badges[filter];
    return (
      <span className={`px-2 py-1 ${badge.bg} ${badge.text} text-xs font-medium rounded-full`}>
        {badge.label}
      </span>
    );
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

  const canModerate = filter === 'pending' || filter === 'blocked';
  const showModerationDetails = imageFlags || toxicityFlags;

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5">
          {/* Header com autor */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {author?.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.full_name || 'Usuário'}
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
                <p className="font-medium text-gray-900">{author?.full_name || 'Usuário'}</p>
                <p className="text-xs text-gray-500">{author?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getScoreBadge()}
            </div>
          </div>

          {/* Título */}
          {post.title && (
            <h3 className="font-bold text-gray-900 mb-2">{post.title}</h3>
          )}

          {/* Conteúdo */}
          {post.content && (
            <div
              className="text-gray-700 text-sm whitespace-pre-wrap line-clamp-6 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          )}

          {/* Mídia */}
          {post.media_url && Array.isArray(post.media_url) && post.media_url.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {post.media_url.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Mídia ${idx + 1}`}
                  className="h-32 w-32 object-cover rounded-lg flex-shrink-0"
                />
              ))}
            </div>
          )}

          {/* Motivos do bloqueio (para posts bloqueados) */}
          {filter === 'blocked' && blockedReasons.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">Motivos do bloqueio:</p>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {blockedReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Motivo da rejeição (para posts rejeitados) */}
          {filter === 'rejected' && post.rejection_reason && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Motivo da rejeição:</strong> {post.rejection_reason}
              </p>
            </div>
          )}

          {/* Info para pedidos de ajuda */}
          {filter === 'help_request' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                Este post está visível na aba &quot;Pedidos de Ajuda&quot; do feed.
              </p>
            </div>
          )}

          {/* Detalhes da moderação (expandível) */}
          {showModerationDetails && (
            <div className="mt-4">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                {showDetails ? '▼ Ocultar' : '▶ Ver'} detalhes da moderação
              </button>

              {showDetails && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-3">
                  {imageFlags && (
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Análise de Imagem:</p>
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
                      <p className="font-medium text-gray-700 mb-1">Análise de Toxicidade:</p>
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

          {/* Data de criação */}
          <p className="text-xs text-gray-400 mt-4">
            Criado em {new Date(post.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>

          {/* Ações */}
          <div className="mt-4 pt-4 border-t flex gap-3">
            <Link href={`/admin/posts/${post.id}/editar`}>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </Link>

            {canModerate && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  variant="primary"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Processando...' : 'Aprovar'}
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {filter === 'blocked' ? 'Manter Bloqueado' : 'Rejeitar'}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Modal de Rejeição */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {filter === 'blocked' ? 'Confirmar Bloqueio' : 'Rejeitar Post'}
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo (opcional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Explique o motivo..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
