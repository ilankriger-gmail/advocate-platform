'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { NpsLead } from '@/lib/supabase/types';
import { bulkApproveLeads, bulkApproveAndNotify } from '@/actions/leads';
import { Button } from '@/components/ui/Button';

interface BulkApproveByScoreProps {
  leads: NpsLead[];
}

type FilterMode = 'nps' | 'ai' | 'both';

export function BulkApproveByScore({ leads }: BulkApproveByScoreProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('nps');
  const [minNpsScore, setMinNpsScore] = useState(9);
  const [minAiScore, setMinAiScore] = useState(70);
  const [showConfirm, setShowConfirm] = useState<'approve' | 'approveNotify' | null>(null);

  // Filtrar apenas leads pendentes
  const pendingLeads = leads.filter(l => l.status === 'pending');

  // Calcular leads que atendem os criterios
  const matchingLeads = useMemo(() => {
    return pendingLeads.filter(lead => {
      if (filterMode === 'nps') {
        return lead.score >= minNpsScore;
      } else if (filterMode === 'ai') {
        return lead.ai_score !== null && lead.ai_score >= minAiScore;
      } else {
        // both
        return lead.score >= minNpsScore &&
               (lead.ai_score !== null && lead.ai_score >= minAiScore);
      }
    });
  }, [pendingLeads, filterMode, minNpsScore, minAiScore]);

  // Estatisticas dos leads que serao aprovados
  const stats = useMemo(() => {
    const withPhone = matchingLeads.filter(l => l.phone).length;
    const avgNps = matchingLeads.length > 0
      ? Math.round(matchingLeads.reduce((sum, l) => sum + l.score, 0) / matchingLeads.length * 10) / 10
      : 0;
    const withAiScore = matchingLeads.filter(l => l.ai_score !== null);
    const avgAi = withAiScore.length > 0
      ? Math.round(withAiScore.reduce((sum, l) => sum + (l.ai_score || 0), 0) / withAiScore.length)
      : 0;
    return { withPhone, avgNps, avgAi, withAiScore: withAiScore.length };
  }, [matchingLeads]);

  // Aprovar todos os leads que atendem os criterios
  const handleApprove = async (notify: boolean) => {
    if (matchingLeads.length === 0) return;

    setIsLoading(true);
    const ids = matchingLeads.map(l => l.id);

    const result = notify
      ? await bulkApproveAndNotify(ids)
      : await bulkApproveLeads(ids);

    setIsLoading(false);
    setShowConfirm(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.data) {
      if (notify && 'emailsSent' in result.data) {
        alert(
          `${result.data.approved} lead(s) aprovado(s)!\n` +
          `${result.data.emailsSent} email(s) enviado(s)\n` +
          `${result.data.tasksScheduled} tarefa(s) agendada(s)`
        );
      } else if ('approved' in result.data) {
        alert(`${result.data.approved} lead(s) aprovado(s) com sucesso!`);
      }
    }

    setIsOpen(false);
    router.refresh();
  };

  if (pendingLeads.length === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 border-indigo-300 hover:bg-indigo-50"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Aprovar por Score
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Aprovar Leads por Score
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modo de filtro */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por:
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterMode('nps')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filterMode === 'nps'
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-pink-300'
                  }`}
                >
                  Nota NPS
                </button>
                <button
                  onClick={() => setFilterMode('ai')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filterMode === 'ai'
                      ? 'bg-purple-500 text-white border-purple-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  Score IA
                </button>
                <button
                  onClick={() => setFilterMode('both')}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filterMode === 'both'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                  }`}
                >
                  Ambos
                </button>
              </div>
            </div>

            {/* Sliders de score */}
            <div className="space-y-4 mb-6">
              {/* NPS Score */}
              {(filterMode === 'nps' || filterMode === 'both') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nota NPS minima
                    </label>
                    <span className={`text-lg font-bold ${
                      minNpsScore >= 9 ? 'text-green-600' :
                      minNpsScore >= 7 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {minNpsScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={minNpsScore}
                    onChange={(e) => setMinNpsScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0 (Detrator)</span>
                    <span>7-8 (Neutro)</span>
                    <span>9-10 (Promotor)</span>
                  </div>
                </div>
              )}

              {/* AI Score */}
              {(filterMode === 'ai' || filterMode === 'both') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Score IA minimo
                    </label>
                    <span className={`text-lg font-bold ${
                      minAiScore >= 70 ? 'text-green-600' :
                      minAiScore >= 40 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {minAiScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={minAiScore}
                    onChange={(e) => setMinAiScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0 (Baixo)</span>
                    <span>40-69 (Medio)</span>
                    <span>70-100 (Alto)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Preview dos resultados */}
            <div className={`rounded-lg p-4 mb-4 ${
              matchingLeads.length > 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}>
              <div className="text-center mb-3">
                <span className={`text-3xl font-bold ${
                  matchingLeads.length > 0 ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {matchingLeads.length}
                </span>
                <span className="text-sm text-gray-600 ml-2">
                  lead(s) serao aprovados
                </span>
              </div>

              {matchingLeads.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-500">NPS Medio</p>
                    <p className="font-semibold text-pink-600">{stats.avgNps}</p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-500">Score IA Medio</p>
                    <p className="font-semibold text-purple-600">
                      {stats.avgAi > 0 ? stats.avgAi : '-'}
                    </p>
                  </div>
                  <div className="bg-white rounded p-2">
                    <p className="text-gray-500">Com Telefone</p>
                    <p className="font-semibold text-blue-600">{stats.withPhone}</p>
                  </div>
                </div>
              )}

              {matchingLeads.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Nenhum lead pendente atende aos criterios selecionados
                </p>
              )}
            </div>

            {/* Info */}
            {filterMode === 'ai' && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 mb-4 text-xs text-purple-700">
                <strong>Nota:</strong> Apenas leads que ja foram analisados pela IA serao considerados.
                {pendingLeads.filter(l => l.ai_score === null).length > 0 && (
                  <span> Existem {pendingLeads.filter(l => l.ai_score === null).length} leads sem analise IA.</span>
                )}
              </div>
            )}

            {/* Botoes */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm('approve')}
                disabled={matchingLeads.length === 0 || isLoading}
                className="flex-1 text-green-600 border-green-300 hover:bg-green-50 disabled:opacity-50"
              >
                Aprovar ({matchingLeads.length})
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowConfirm('approveNotify')}
                disabled={matchingLeads.length === 0 || isLoading}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
              >
                Aprovar + Notificar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmacao */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Aprovacao
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Voce esta prestes a aprovar <strong>{matchingLeads.length} lead(s)</strong>
              {showConfirm === 'approveNotify' && ' e enviar notificacoes de boas-vindas'}.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600">
                <strong>Criterios:</strong>{' '}
                {filterMode === 'nps' && `NPS >= ${minNpsScore}`}
                {filterMode === 'ai' && `Score IA >= ${minAiScore}`}
                {filterMode === 'both' && `NPS >= ${minNpsScore} E Score IA >= ${minAiScore}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(null)}
                disabled={isLoading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(showConfirm === 'approveNotify')}
                isLoading={isLoading}
                className={`flex-1 ${
                  showConfirm === 'approveNotify'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
