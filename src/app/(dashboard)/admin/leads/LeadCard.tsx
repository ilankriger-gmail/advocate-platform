'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NpsLead } from '@/lib/supabase/types';
import { approveLead, rejectLead, sendLeadEmailNotification, sendLeadWhatsAppNotification, sendAllNotifications } from '@/actions/leads';
import { Button } from '@/components/ui/Button';

interface LeadCardProps {
  lead: NpsLead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Cor do badge baseada no score NPS
  const getScoreBadgeColor = (score: number) => {
    if (score <= 6) return 'bg-red-500 text-white';
    if (score <= 8) return 'bg-yellow-500 text-white';
    return 'bg-green-500 text-white';
  };

  // Categoria NPS
  const getNpsCategory = (score: number) => {
    if (score <= 6) return 'Detrator';
    if (score <= 8) return 'Neutro';
    return 'Promotor';
  };

  // Status badge
  const getStatusBadge = () => {
    switch (lead.status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Aprovado</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">Reprovado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">Pendente</span>;
    }
  };

  async function handleApprove() {
    setIsLoading(true);
    const result = await approveLead(lead.id);
    setIsLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    router.refresh();
  }

  async function handleReject() {
    setIsLoading(true);
    const result = await rejectLead(lead.id, rejectReason || undefined);
    setIsLoading(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    setShowRejectModal(false);
    router.refresh();
  }

  const formattedDate = new Date(lead.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Score Badge */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${getScoreBadgeColor(lead.score)}`}>
              {lead.score}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{lead.name}</h3>
              <p className="text-sm text-gray-500">{getNpsCategory(lead.score)}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Contato */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {lead.email}
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {lead.phone}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
          <span>{formattedDate}</span>
          <span className="text-pink-600 font-medium">{lead.reason_length} caracteres</span>
        </div>

        {/* Motivo */}
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className={`text-sm text-gray-700 ${!expanded && 'line-clamp-3'}`}>
            &quot;{lead.reason}&quot;
          </p>
          {lead.reason_length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-pink-600 hover:text-pink-700 mt-1"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>

        {/* Analise AI */}
        {lead.ai_score !== null && lead.ai_score !== undefined && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🤖</span>
              <span className="text-xs font-semibold text-indigo-700">Analise AI</span>
            </div>

            <div className="flex items-center gap-3 mb-2">
              {/* Score Badge */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                lead.ai_score >= 70 ? 'bg-green-500 text-white' :
                lead.ai_score >= 40 ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}>
                {lead.ai_score}
              </div>

              <div className="flex-1">
                {/* Sentiment */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <span>
                    {lead.ai_sentiment === 'positivo' ? '😊' :
                     lead.ai_sentiment === 'neutro' ? '😐' : '😟'}
                  </span>
                  <span className="capitalize">{lead.ai_sentiment}</span>
                </div>

                {/* Recommendation */}
                <div className={`text-xs font-medium ${
                  lead.ai_recommendation === 'aprovar' ? 'text-green-600' :
                  lead.ai_recommendation === 'analisar' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {lead.ai_recommendation === 'aprovar' ? '✅ Recomenda aprovar' :
                   lead.ai_recommendation === 'analisar' ? '⚠️ Requer analise' :
                   '❌ Recomenda rejeitar'}
                </div>
              </div>
            </div>

            {/* Summary */}
            {lead.ai_summary && (
              <p className="text-xs text-gray-600 italic mb-2">
                &quot;{lead.ai_summary}&quot;
              </p>
            )}

            {/* Strengths & Concerns */}
            <div className="flex flex-wrap gap-1">
              {lead.ai_strengths?.map((strength, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  <span>✓</span> {strength}
                </span>
              ))}
              {lead.ai_concerns?.map((concern, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  <span>⚠</span> {concern}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notificacoes enviadas e acoes */}
        {lead.status === 'approved' && (
          <div className="space-y-2">
            {/* Status das notificacoes */}
            <div className="flex gap-2">
              {lead.email_sent && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Email enviado
                </span>
              )}
              {lead.whatsapp_sent && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  WhatsApp enviado
                </span>
              )}
            </div>

            {/* Botoes de notificacao */}
            {(!lead.email_sent || (!lead.whatsapp_sent && lead.phone)) && (
              <div className="flex gap-2">
                {!lead.email_sent && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsLoading(true);
                      const result = await sendLeadEmailNotification(lead.id);
                      setIsLoading(false);
                      if (result.error) {
                        alert(result.error);
                      } else {
                        router.refresh();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar Email
                  </Button>
                )}
                {!lead.whatsapp_sent && lead.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      setIsLoading(true);
                      const result = await sendLeadWhatsAppNotification(lead.id);
                      setIsLoading(false);
                      if (result.error) {
                        alert(result.error);
                      } else {
                        router.refresh();
                      }
                    }}
                    disabled={isLoading}
                    className="flex-1 text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    </svg>
                    Enviar WhatsApp
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Motivo de rejeicao */}
        {lead.status === 'rejected' && lead.rejection_reason && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700">
              <span className="font-medium">Motivo:</span> {lead.rejection_reason}
            </p>
          </div>
        )}

        {/* Acoes */}
        {lead.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              isLoading={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Aprovar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectModal(true)}
              disabled={isLoading}
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              Reprovar
            </Button>
          </div>
        )}
      </div>

      {/* Modal de rejeicao */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reprovar Lead
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Deseja informar o motivo da reprovacao? (opcional)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da reprovacao..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                isLoading={isLoading}
                className="flex-1"
              >
                Confirmar Reprovacao
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
