'use client';

import { Card } from '@/components/ui';

interface RankingEntry {
  user_id: string;
  user_name: string;
  user_avatar?: string;
  result_value: number;
  approved_at: string;
  beat_goal: boolean;
}

interface ChallengeRankingProps {
  entries: RankingEntry[];
  goalType: 'repetitions' | 'time' | null;
  goalValue: number | null;
  maxEntries?: number;
}

export function ChallengeRanking({
  entries,
  goalType,
  goalValue,
  maxEntries = 10,
}: ChallengeRankingProps) {
  const unit = goalType === 'time' ? 's' : 'x';
  const displayEntries = entries.slice(0, maxEntries);

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `${position + 1}`;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: 'short',
    });
  };

  if (entries.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500 text-sm">Nenhum participante aprovado ainda</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 text-white">
        <h3 className="font-bold flex items-center gap-2">
          <span>🏆</span> Ranking
        </h3>
      </div>

      <div className="divide-y divide-gray-100">
        {displayEntries.map((entry, index) => (
          <div
            key={entry.user_id}
            className={`flex items-center justify-between p-3 ${
              entry.beat_goal ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-8 text-center font-bold ${
                index < 3 ? 'text-xl' : 'text-gray-400'
              }`}>
                {getMedalEmoji(index)}
              </span>

              {entry.user_avatar ? (
                <img
                  src={entry.user_avatar}
                  alt={entry.user_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                  {entry.user_name[0]}
                </div>
              )}

              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {entry.user_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(entry.approved_at)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-bold ${
                entry.beat_goal ? 'text-green-600' : 'text-indigo-600'
              }`}>
                {entry.result_value}{unit}
              </p>
              {entry.beat_goal && (
                <p className="text-xs text-green-600">Meta batida!</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {entries.length > maxEntries && (
        <div className="p-2 text-center bg-gray-50 text-xs text-gray-500">
          +{entries.length - maxEntries} participantes
        </div>
      )}
    </Card>
  );
}

// Componente para buscar e exibir ranking de um desafio especifico
interface ChallengeRankingLoaderProps {
  challengeId: string;
  goalType: 'repetitions' | 'time' | null;
  goalValue: number | null;
  participants: Array<{
    user_id: string;
    result_value: number | null;
    approved_at: string;
    status: string;
    profiles?: {
      full_name?: string;
      avatar_url?: string;
    } | null;
  }>;
}

export function ChallengeRankingFromData({
  goalType,
  goalValue,
  participants,
}: ChallengeRankingLoaderProps) {
  // Filtrar apenas aprovados e ordenar por resultado
  const approvedParticipants = participants
    .filter((p) => p.status === 'approved' && p.result_value !== null)
    .sort((a, b) => {
      // Para tempo, menor e melhor. Para repeticoes, maior e melhor
      if (goalType === 'time') {
        return (a.result_value || 0) - (b.result_value || 0);
      }
      return (b.result_value || 0) - (a.result_value || 0);
    });

  const entries: RankingEntry[] = approvedParticipants.map((p) => ({
    user_id: p.user_id,
    user_name: p.profiles?.full_name || 'Usuário',
    user_avatar: p.profiles?.avatar_url || undefined,
    result_value: p.result_value || 0,
    approved_at: p.approved_at,
    beat_goal: goalValue
      ? goalType === 'time'
        ? (p.result_value || 0) <= goalValue
        : (p.result_value || 0) >= goalValue
      : false,
  }));

  return (
    <ChallengeRanking
      entries={entries}
      goalType={goalType}
      goalValue={goalValue}
    />
  );
}
