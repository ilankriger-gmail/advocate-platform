'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { approveParticipation, rejectParticipation } from '@/actions/challenges-admin';
import { X, Check, Loader2, ExternalLink, Youtube, Instagram } from 'lucide-react';

interface Participation {
  id: string;
  status: string;
  created_at: string;
  video_proof_url: string | null;
  social_media_url: string | null;
  instagram_proof_url: string | null;
  result_value: number | null;
  ai_confidence: number | null;
  challenge_id: string;
  user_id: string;
  challenges: {
    id: string;
    title: string;
    type: string;
    icon: string;
    coins_reward: number;
  } | null;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    instagram_handle: string | null;
  } | null;
}

interface PendingParticipationsListProps {
  participations: Participation[];
  onClose: () => void;
}

export function PendingParticipationsList({ participations, onClose }: PendingParticipationsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localParticipations, setLocalParticipations] = useState(participations);

  const handleApprove = async (participationId: string, coinsReward: number | undefined) => {
    setLoadingId(participationId);
    try {
      const result = await approveParticipation(participationId, coinsReward || 0);
      if (result.success) {
        // Remove da lista local
        setLocalParticipations(prev => prev.filter(p => p.id !== participationId));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (participationId: string) => {
    setLoadingId(participationId);
    try {
      const result = await rejectParticipation(participationId, 'Participação rejeitada pelo admin');
      if (result.success) {
        // Remove da lista local
        setLocalParticipations(prev => prev.filter(p => p.id !== participationId));
        router.refresh();
      }
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProofUrl = (p: Participation) => {
    return p.video_proof_url || p.instagram_proof_url || p.social_media_url;
  };

  const getProofType = (p: Participation) => {
    if (p.video_proof_url?.includes('youtube') || p.video_proof_url?.includes('youtu.be')) return 'youtube';
    if (p.instagram_proof_url || p.social_media_url?.includes('instagram')) return 'instagram';
    return 'link';
  };

  if (localParticipations.length === 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-800">Tudo em dia!</p>
              <p className="text-sm text-green-600">Nenhuma participação pendente no momento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-green-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-green-700" />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-xl">⏳</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">{localParticipations.length} Participações Pendentes</h2>
            <p className="text-sm text-white/80">Revise e aprove as participações abaixo</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lista */}
      <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
        {localParticipations.map((participation) => {
          const isLoading = loadingId === participation.id;
          const proofUrl = getProofUrl(participation);
          const proofType = getProofType(participation);

          return (
            <div key={participation.id} className={`p-4 ${isLoading ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {participation.profiles?.avatar_url ? (
                    <img
                      src={participation.profiles.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-lg">👤</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {participation.profiles?.full_name || 'Usuário'}
                    </span>
                    {participation.profiles?.instagram_handle && (
                      <span className="text-sm text-pink-600">
                        @{participation.profiles.instagram_handle}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{participation.challenges?.icon || '🎯'}</span>
                    <span className="text-sm text-gray-600 truncate">
                      {participation.challenges?.title || 'Desafio'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{formatDate(participation.created_at)}</span>
                    {participation.ai_confidence !== null && (
                      <span className={`px-2 py-0.5 rounded-full ${
                        participation.ai_confidence >= 80
                          ? 'bg-green-100 text-green-700'
                          : participation.ai_confidence >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}>
                        IA: {participation.ai_confidence}%
                      </span>
                    )}
                    {proofUrl && (
                      <a
                        href={proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                      >
                        {proofType === 'youtube' && <Youtube className="w-3 h-3" />}
                        {proofType === 'instagram' && <Instagram className="w-3 h-3" />}
                        {proofType === 'link' && <ExternalLink className="w-3 h-3" />}
                        Ver prova
                      </a>
                    )}
                  </div>
                </div>

                {/* Acoes */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(participation.id)}
                    disabled={isLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(participation.id, participation.challenges?.coins_reward)}
                    disabled={isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        +{participation.challenges?.coins_reward || 0}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
