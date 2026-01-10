'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/ui';
import { approvePost, rejectPost } from '@/actions/posts';

interface Post {
  id: string;
  title: string | null;
  content: string;
  media_url: string[] | null;
  type: string;
  created_at: string;
  rejection_reason?: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  instagram_username: string;
}

interface PostModerationCardProps {
  post: Post;
  profile: Profile | null;
  status: 'pending' | 'approved' | 'rejected';
}

export function PostModerationCard({ post, profile, status }: PostModerationCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = async () => {
    setIsLoading(true);
    const result = await approvePost(post.id);
    if (result.success) {
      router.refresh();
    }
    setIsLoading(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    setIsLoading(true);
    const result = await rejectPost(post.id, rejectReason);
    if (result.success) {
      setShowRejectModal(false);
      router.refresh();
    }
    setIsLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeBadge = () => {
    switch (post.type) {
      case 'testimony':
        return <Badge className="bg-pink-100 text-pink-700">Depoimento</Badge>;
      case 'result':
        return <Badge className="bg-green-100 text-green-700">Resultado</Badge>;
      case 'tip':
        return <Badge className="bg-blue-100 text-blue-700">Dica</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{post.type}</Badge>;
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-5">
          {/* Header com autor */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {profile?.full_name?.[0] || '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
                {profile?.instagram_username && (
                  <p className="text-sm text-gray-500">@{profile.instagram_username}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getTypeBadge()}
              <span className="text-xs text-gray-400">{formatDate(post.created_at)}</span>
            </div>
          </div>

          {/* Título */}
          {post.title && (
            <h3 className="font-bold text-gray-900 mb-2">{post.title}</h3>
          )}

          {/* Conteudo */}
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

          {/* Midia */}
          {post.media_url && post.media_url.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {post.media_url.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Midia ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Motivo de rejeicao */}
          {status === 'rejected' && post.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Motivo:</strong> {post.rejection_reason}
              </p>
            </div>
          )}

          {/* Acoes */}
          {status === 'pending' && (
            <div className="mt-4 pt-4 border-t flex gap-3">
              <Button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Aprovando...' : 'Aprovar'}
              </Button>
              <Button
                onClick={() => setShowRejectModal(true)}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                Rejeitar
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Rejeicao */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rejeitar Post</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da rejeicao
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Explique o motivo da rejeicao..."
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
                disabled={isLoading || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? 'Rejeitando...' : 'Confirmar Rejeicao'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
