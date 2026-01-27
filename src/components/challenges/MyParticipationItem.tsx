'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ParticipationWithChallenge } from '@/lib/supabase/types';

interface MyParticipationItemProps {
  participation: ParticipationWithChallenge;
}

export function MyParticipationItem({ participation }: MyParticipationItemProps) {
  const [expanded, setExpanded] = useState(false);
  const challenge = participation.challenges;
  const goalLabel = challenge?.goal_type === 'time' ? 'segundos' : 'repetições';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: 'short',
    });
  };

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

  const getStatusBadge = () => {
    switch (participation.status) {
      case 'rejected':
        return (
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            Rejeitado
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
            Aguardando
          </span>
        );
      default:
        return null;
    }
  };

  const confidence = participation.ai_confidence ?? 0;

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Linha compacta (sempre visível) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg flex-shrink-0">{getStatusIcon()}</span>
          <span className="font-medium text-gray-900 text-sm truncate">
            {challenge?.title || 'Desafio'}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {formatDate(participation.created_at)}
          </span>

          {participation.status === 'approved' && participation.coins_earned > 0 ? (
            <span className="text-pink-600 font-medium text-sm">
              +{participation.coins_earned} ❤️
            </span>
          ) : (
            getStatusBadge()
          )}

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Área expansível */}
      {expanded && (
        <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100">
          <div className="pt-3 space-y-3">
            {/* Data em mobile */}
            <p className="text-xs text-gray-500 sm:hidden">
              Enviado em {formatDate(participation.created_at)}
            </p>

            {/* Resultados */}
            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
                <p className="text-xs text-gray-500">Seu resultado</p>
                <p className="font-bold text-gray-900 text-sm">
                  {participation.result_value} {goalLabel}
                </p>
              </div>
              {participation.ai_observed_value !== null && (
                <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-gray-500">IA contou</p>
                  <p className="font-bold text-gray-900 text-sm">
                    {participation.ai_observed_value} {goalLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Análise de IA */}
            {participation.ai_analyzed_at && (
              <div className="bg-white rounded-lg p-2 border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <span>🤖</span> Confiança
                  </span>
                  <span className={`text-xs font-medium ${
                    confidence >= 80 ? 'text-green-600' :
                    confidence >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      confidence >= 80 ? 'bg-green-500' :
                      confidence >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                {participation.ai_reason && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    &ldquo;{participation.ai_reason}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Moedas ganhas (se aprovado) */}
            {participation.status === 'approved' && participation.coins_earned > 0 && (
              <div className="flex items-center gap-2 text-sm bg-green-50 rounded-lg p-2 border border-green-200">
                <span>❤️</span>
                <span className="font-medium text-green-700">
                  Você ganhou {participation.coins_earned} corações!
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
