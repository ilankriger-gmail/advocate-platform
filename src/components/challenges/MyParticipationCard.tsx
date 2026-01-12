import { Card } from '@/components/ui';
import type { ParticipationWithChallenge } from '@/lib/supabase/types';

interface MyParticipationCardProps {
  participation: ParticipationWithChallenge;
}

export function MyParticipationCard({ participation }: MyParticipationCardProps) {
  const challenge = participation.challenges;
  const goalLabel = challenge?.goal_type === 'time' ? 'segundos' : 'repeticoes';

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Status badge
  const getStatusBadge = () => {
    switch (participation.status) {
      case 'approved':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Aprovado
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Rejeitado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
            Aguardando
          </span>
        );
    }
  };

  // Ícone de status
  const getStatusIcon = () => {
    switch (participation.status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      default:
        return '⏳';
    }
  };

  const confidence = participation.ai_confidence ?? 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStatusIcon()}</span>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {challenge?.title || 'Desafio'}
              </h3>
              <p className="text-xs text-gray-500">
                {formatDate(participation.created_at)}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Resultados */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">Seu resultado</p>
            <p className="font-bold text-gray-900 text-sm">
              {participation.result_value} {goalLabel}
            </p>
          </div>
          {participation.ai_observed_value !== null && (
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-500">IA contou</p>
              <p className="font-bold text-gray-900 text-sm">
                {participation.ai_observed_value} {goalLabel}
              </p>
            </div>
          )}
        </div>

        {/* Análise de IA */}
        {participation.ai_analyzed_at && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🤖</span>
              <p className="text-xs font-medium text-gray-700">Análise da IA</p>
            </div>

            {/* Barra de confiança */}
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Confiança</span>
                <span className="font-medium text-gray-700">{confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    confidence >= 80
                      ? 'bg-green-500'
                      : confidence >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>

            {/* Motivo da IA */}
            {participation.ai_reason && (
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 line-clamp-2">
                &ldquo;{participation.ai_reason}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Moedas ganhas */}
        {participation.status === 'approved' && participation.coins_earned > 0 && (
          <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
            <span>❤️</span>
            <span className="font-medium text-pink-600">
              +{participation.coins_earned} corações
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
