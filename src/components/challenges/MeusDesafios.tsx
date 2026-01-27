import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';
import type { ParticipationWithChallenge } from '@/lib/supabase/types';

interface MeusDesafiosProps {
  userId: string;
}

// Função para formatar data
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Componente de status badge
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <span>✅</span> Aprovado
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <span>❌</span> Rejeitado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          Pendente
        </span>
      );
  }
}

// Componente de item de submissão
function SubmissionItem({ participation }: { participation: ParticipationWithChallenge }) {
  const challenge = participation.challenges;
  const challengeUrl = challenge?.slug
    ? `/desafios/${challenge.slug}`
    : `/desafios/${participation.challenge_id}`;

  return (
    <div className="border-b border-gray-100 last:border-b-0 p-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Título do desafio com link */}
          <Link
            href={challengeUrl}
            className="font-medium text-gray-900 text-sm hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {challenge?.title || 'Desafio'}
          </Link>

          {/* Data de submissão */}
          <p className="text-xs text-gray-500 mt-0.5">
            Enviado em {formatDate(participation.created_at)}
          </p>

          {/* Motivo da rejeição (se houver) */}
          {participation.status === 'rejected' && participation.rejection_reason && (
            <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
              Motivo: {participation.rejection_reason}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {/* Status badge */}
          <StatusBadge status={participation.status} />

          {/* Corações ganhos (se aprovado) */}
          {participation.status === 'approved' && participation.coins_earned > 0 && (
            <span className="text-pink-600 font-medium text-sm">
              +{participation.coins_earned} ❤️
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export async function MeusDesafios({ userId }: MeusDesafiosProps) {
  const supabase = await createClient();

  // Buscar submissões do usuário com dados do desafio
  const { data: submissions, error } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges (
        title,
        slug,
        type,
        goal_type,
        goal_value,
        coins_reward
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Erro ao buscar submissões:', error);
    return null;
  }

  const participations = (submissions || []) as ParticipationWithChallenge[];

  // Contadores por status
  const pendingCount = participations.filter(p => p.status === 'pending').length;
  const approvedCount = participations.filter(p => p.status === 'approved').length;
  const rejectedCount = participations.filter(p => p.status === 'rejected').length;

  return (
    <Card className="overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
            Meus Desafios
          </h3>
          <Link
            href="/desafios"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Ver todos
          </Link>
        </div>

        {/* Mini estatísticas */}
        {participations.length > 0 && (
          <div className="flex gap-3 mt-2 text-xs">
            {pendingCount > 0 && (
              <span className="text-yellow-600">
                🟡 {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
            {approvedCount > 0 && (
              <span className="text-green-600">
                ✅ {approvedCount} aprovado{approvedCount > 1 ? 's' : ''}
              </span>
            )}
            {rejectedCount > 0 && (
              <span className="text-red-600">
                ❌ {rejectedCount} rejeitado{rejectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {participations.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-gray-500 text-sm mb-3">
            Você ainda não participou de nenhum desafio.
          </p>
          <Link
            href="/desafios"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            🎯 Ver desafios
          </Link>
        </div>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          {participations.map((participation) => (
            <SubmissionItem
              key={participation.id}
              participation={participation}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
