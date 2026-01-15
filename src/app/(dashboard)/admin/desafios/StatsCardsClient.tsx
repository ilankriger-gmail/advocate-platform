'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { PendingParticipationsList } from './PendingParticipationsList';

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
  };
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    instagram_username: string | null;
  };
}

interface StatsCardsClientProps {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  totalPending: number;
  pendingParticipations: Participation[];
}

export function StatsCardsClient({
  totalChallenges,
  activeChallenges,
  totalParticipants,
  totalPending,
  pendingParticipations,
}: StatsCardsClientProps) {
  const [showPendingList, setShowPendingList] = useState(false);

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📊</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{totalChallenges}</p>
              <p className="text-xs text-blue-600">Total Desafios</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{activeChallenges}</p>
              <p className="text-xs text-green-600">Ativos</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{totalParticipants}</p>
              <p className="text-xs text-purple-600">Participacoes</p>
            </div>
          </div>
        </Card>

        {/* Card Pendentes - Clicavel */}
        <button
          onClick={() => setShowPendingList(true)}
          className="text-left"
        >
          <Card className={`p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-100 transition-all duration-200 ${
            totalPending > 0
              ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer ring-2 ring-yellow-300 ring-offset-2'
              : ''
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                totalPending > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-500'
              }`}>
                <span className="text-white text-lg">⏳</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{totalPending}</p>
                <p className="text-xs text-yellow-600">
                  {totalPending > 0 ? 'Pendentes (clique)' : 'Pendentes'}
                </p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {/* Lista de Pendentes (quando aberta) */}
      {showPendingList && (
        <PendingParticipationsList
          participations={pendingParticipations}
          onClose={() => setShowPendingList(false)}
        />
      )}
    </>
  );
}
