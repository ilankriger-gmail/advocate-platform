'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Avatar, Button } from '@/components/ui';
import { X, ExternalLink, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';
import { revertApproval } from '@/actions/challenges-admin';

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
  coins_earned?: number | null;
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

interface AllParticipationsListProps {
  participations: Participation[];
  onClose: () => void;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function AllParticipationsList({ participations, onClose }: AllParticipationsListProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [reverting, setReverting] = useState<string | null>(null);
  const router = useRouter();

  const handleRevert = async (participationId: string) => {
    if (!confirm('Tem certeza? Isso vai REMOVER os corações do usuário e voltar para pendente.')) {
      return;
    }
    setReverting(participationId);
    try {
      const result = await revertApproval(participationId);
      if (result.error) {
        alert(`Erro: ${result.error}`);
      } else {
        alert('Aprovação revertida! Corações removidos.');
        router.refresh();
        onClose();
      }
    } catch {
      alert('Erro ao reverter');
    } finally {
      setReverting(null);
    }
  };

  const filteredParticipations = participations.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3 h-3" />
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
    }
  };

  const counts = {
    all: participations.length,
    pending: participations.filter(p => p.status === 'pending').length,
    approved: participations.filter(p => p.status === 'approved').length,
    rejected: participations.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">👥 Todas as Participações</h2>
            <p className="text-sm text-gray-600">{participations.length} participações no total</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b bg-gray-50 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas ({counts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏳ Pendentes ({counts.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✅ Aprovadas ({counts.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            ❌ Rejeitadas ({counts.rejected})
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredParticipations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Nenhuma participação encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipations.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    p.status === 'pending' 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : p.status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={p.profiles?.full_name || 'Usuário'}
                      src={p.profiles?.avatar_url || undefined}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">
                          {p.profiles?.full_name || 'Usuário'}
                        </span>
                        {p.profiles?.instagram_handle && (
                          <a 
                            href={`https://instagram.com/${p.profiles.instagram_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-pink-500 hover:text-pink-700"
                          >
                            @{p.profiles.instagram_handle}
                          </a>
                        )}
                        {getStatusBadge(p.status)}
                        {p.coins_earned && p.coins_earned > 0 && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                            +{p.coins_earned} ❤️
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {p.challenges?.icon} {p.challenges?.title}
                      </p>
                      
                      {/* Detalhes expandidos */}
                      <div className="mt-3 p-3 bg-white/50 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center gap-4 flex-wrap">
                          {p.result_value !== null && (
                            <span className="font-medium text-purple-600">
                              📊 Resultado: <strong>{p.result_value}</strong>
                            </span>
                          )}
                          <span className="text-gray-500">
                            📅 {new Date(p.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {p.ai_confidence !== null && (
                            <span className="text-gray-500">
                              🤖 IA: {Math.round((p.ai_confidence || 0) * 100)}%
                            </span>
                          )}
                        </div>
                        
                        {/* Links de prova */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {p.video_proof_url && (
                            <a
                              href={p.video_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                            >
                              🎬 Vídeo
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {p.social_media_url && (
                            <a
                              href={p.social_media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
                            >
                              📱 Post Social
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {p.instagram_proof_url && (
                            <a
                              href={p.instagram_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-xs font-medium hover:bg-pink-200 transition-colors"
                            >
                              📸 Instagram
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          {!p.video_proof_url && !p.social_media_url && !p.instagram_proof_url && (
                            <span className="text-xs text-gray-400 italic">
                              Nenhum link de prova enviado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/admin/desafios/${p.challenge_id}`}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                      >
                        Ver desafio →
                      </Link>
                      {p.status === 'approved' && (
                        <button
                          onClick={() => handleRevert(p.id)}
                          disabled={reverting === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Reverter aprovação e remover corações"
                        >
                          <RotateCcw className="w-3 h-3" />
                          {reverting === p.id ? 'Revertendo...' : 'Reverter'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
}
