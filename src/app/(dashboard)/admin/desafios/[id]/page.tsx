import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { ParticipationActions } from './ParticipationActions';
import { WinnerActions } from './WinnerActions';
import { ChallengeActions } from './ChallengeActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDesafioDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Buscar desafio
  const { data: challenge } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();

  if (!challenge) {
    notFound();
  }

  // Buscar participações
  const { data: participations } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        instagram_username,
        avatar_url
      )
    `)
    .eq('challenge_id', id)
    .order('created_at', { ascending: false });

  // Buscar ganhadores
  const { data: winners } = await supabase
    .from('challenge_winners')
    .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        instagram_username
      )
    `)
    .eq('challenge_id', id)
    .order('created_at', { ascending: false });

  const pendingParticipations = (participations || []).filter((p) => p.status === 'pending');
  const approvedParticipations = (participations || []).filter((p) => p.status === 'approved');
  const rejectedParticipations = (participations || []).filter((p) => p.status === 'rejected');

  const getTypeBadge = () => {
    switch (challenge.type) {
      case 'fisico':
        return <Badge className="bg-blue-100 text-blue-700">Fisico</Badge>;
      case 'engajamento':
        return <Badge className="bg-purple-100 text-purple-700">Engajamento</Badge>;
      case 'participe':
        return <Badge className="bg-pink-100 text-pink-700">Participe</Badge>;
      default:
        return null;
    }
  };

  const goalLabel = challenge.goal_type === 'time' ? 'segundos' : 'repeticoes';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{challenge.icon}</span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{challenge.title}</h1>
              {getTypeBadge()}
              {!challenge.is_active && (
                <Badge className="bg-gray-100 text-gray-600">Inativo</Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">{challenge.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-pink-500 font-bold">+{challenge.coins_reward} coracoes</span>
              {challenge.prize_amount && (
                <span className="text-green-600 font-bold">R$ {challenge.prize_amount.toFixed(2)}</span>
              )}
              {challenge.goal_value && (
                <span className="text-blue-600">Meta: {challenge.goal_value} {goalLabel}</span>
              )}
            </div>
          </div>
        </div>
        <ChallengeActions challenge={challenge} />
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{(participations || []).length}</p>
          <p className="text-sm text-gray-500">Total Participantes</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-yellow-500">
          <p className="text-2xl font-bold text-yellow-600">{pendingParticipations.length}</p>
          <p className="text-sm text-gray-500">Pendentes</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600">{approvedParticipations.length}</p>
          <p className="text-sm text-gray-500">Aprovados</p>
        </Card>
        <Card className="p-4 text-center border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-600">{(winners || []).length}</p>
          <p className="text-sm text-gray-500">Ganhadores</p>
        </Card>
      </div>

      {/* Ganhadores (para sorteios) */}
      {(challenge.type === 'engajamento' || challenge.type === 'participe') && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ganhadores</h2>
            <WinnerActions challengeId={challenge.id} prizeAmount={challenge.prize_amount} />
          </div>

          {winners && winners.length > 0 ? (
            <div className="space-y-3">
              {winners.map((winner) => {
                const profile = winner.profiles as { id: string; full_name: string; instagram_username: string } | null;
                return (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
                        {winner.instagram_username && (
                          <p className="text-sm text-gray-500">@{winner.instagram_username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {winner.prize_amount && (
                        <span className="text-green-600 font-bold">
                          R$ {winner.prize_amount.toFixed(2)}
                        </span>
                      )}
                      {winner.pix_sent ? (
                        <Badge className="bg-green-500 text-white">Pix Enviado</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum ganhador registrado ainda
            </div>
          )}
        </Card>
      )}

      {/* Participações Pendentes */}
      {pendingParticipations.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Participações Pendentes ({pendingParticipations.length})
          </h2>

          <div className="space-y-4">
            {pendingParticipations.map((p) => (
              <ParticipationCard
                key={p.id}
                participation={p}
                goalType={challenge.goal_type}
                coinsReward={challenge.coins_reward}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Participações Aprovadas */}
      {approvedParticipations.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Participações Aprovadas ({approvedParticipations.length})
          </h2>

          <div className="space-y-3">
            {approvedParticipations.map((p) => {
              const profile = p.profiles as { id: string; full_name: string; instagram_username: string } | null;
              const unit = challenge.goal_type === 'time' ? 's' : 'x';

              return (
                <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>✅</span>
                    <div>
                      <p className="font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
                      <p className="text-sm text-gray-500">
                        Resultado: {p.result_value}{unit}
                      </p>
                    </div>
                  </div>
                  <span className="text-green-600 font-bold">+{p.coins_earned} coracoes</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sem participações */}
      {(!participations || participations.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhuma participacao</h2>
          <p className="text-gray-500">Ainda não há participações neste desafio</p>
        </Card>
      )}
    </div>
  );
}

interface AIVerdict {
  isValid: boolean;
  confidence: number;
  reason: string;
  analyzedAt: string;
}

interface ParticipationCardProps {
  participation: {
    id: string;
    result_value: number | null;
    vídeo_proof_url: string | null;
    social_media_url: string | null;
    created_at: string;
    profiles: unknown;
    ai_verdict?: AIVerdict | null;
  };
  goalType: string | null;
  coinsReward: number;
}

function ParticipationCard({ participation, goalType, coinsReward }: ParticipationCardProps) {
  const profile = participation.profiles as { id: string; full_name: string; instagram_username: string; avatar_url: string } | null;
  const unit = goalType === 'time' ? 'segundos' : 'repeticoes';

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
      <div className="flex items-start justify-between mb-3">
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
        <span className="text-xs text-gray-400">{formatDate(participation.created_at)}</span>
      </div>

      <div className="mb-3 p-3 bg-white rounded-lg">
        <p className="text-lg font-bold text-indigo-600">
          Resultado: {participation.result_value} {unit}
        </p>
      </div>

      {/* Veredito da IA */}
      {participation.ai_verdict && (
        <div className={`mb-3 p-3 rounded-lg border ${
          participation.ai_verdict.isValid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium flex items-center gap-1">
              {participation.ai_verdict.isValid ? (
                <><span className="text-green-600">IA: Válido</span></>
              ) : (
                <><span className="text-red-600">IA: Inválido</span></>
              )}
            </span>
            <span className={`text-sm font-bold ${
              participation.ai_verdict.confidence >= 70
                ? 'text-green-600'
                : participation.ai_verdict.confidence >= 40
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {participation.ai_verdict.confidence}% confianca
            </span>
          </div>
          <p className="text-xs text-gray-600">{participation.ai_verdict.reason}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {participation.vídeo_proof_url && (
          <a
            href={participation.vídeo_proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Ver Vídeo
          </a>
        )}
        {participation.social_media_url && (
          <a
            href={participation.social_media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
            </svg>
            Ver Post
          </a>
        )}
      </div>

      <ParticipationActions participationId={participation.id} coinsReward={coinsReward} />
    </div>
  );
}
