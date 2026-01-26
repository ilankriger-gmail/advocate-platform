'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Avatar, Button } from '@/components/ui';
import { X, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';

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
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {p.result_value && (
                          <span className="font-medium text-purple-600">
                            Resultado: {p.result_value}
                          </span>
                        )}
                        <span>
                          {new Date(p.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(p.video_proof_url || p.social_media_url || p.instagram_proof_url) && (
                        <a
                          href={p.video_proof_url || p.social_media_url || p.instagram_proof_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver prova"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/desafios/${p.challenge_id}`}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        Ver desafio →
                      </Link>
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
