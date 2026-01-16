'use client';

import { useState, useTransition } from 'react';
import { updateAutoApprovalSettings } from '@/actions/settings';

interface AutoApprovalSettingsProps {
  initialEnabled: boolean;
  initialMinScore: number;
}

export function AutoApprovalSettings({
  initialEnabled,
  initialMinScore,
}: AutoApprovalSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [minScore, setMinScore] = useState(initialMinScore);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    saveSettings(newEnabled, minScore);
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = parseInt(e.target.value, 10);
    setMinScore(newScore);
  };

  const handleScoreCommit = () => {
    saveSettings(enabled, minScore);
  };

  const saveSettings = (newEnabled: boolean, newMinScore: number) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAutoApprovalSettings(newEnabled, newMinScore);
      if (result.success) {
        setMessage({ type: 'success', text: 'Salvo!' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao salvar' });
      }
    });
  };

  // Cor do slider baseada no score
  const getScoreColor = () => {
    if (minScore >= 80) return 'text-green-600';
    if (minScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all ${enabled ? 'border-purple-200 bg-purple-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Titulo e Toggle */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
            <svg
              className={`w-4 h-4 ${enabled ? 'text-purple-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Auto-Aprovação</h3>
            <p className="text-xs text-gray-500">
              {enabled
                ? `Leads com score AI >= ${minScore} são aprovados automaticamente`
                : 'Desativado - todos os leads aguardam aprovação manual'}
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            enabled ? 'bg-purple-600' : 'bg-gray-200'
          } ${isPending ? 'opacity-50' : ''}`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Slider de Score (visivel apenas quando ativado) */}
      {enabled && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">Score minimo AI</label>
            <span className={`text-lg font-bold ${getScoreColor()}`}>{minScore}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">0</span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minScore}
              onChange={handleScoreChange}
              onMouseUp={handleScoreCommit}
              onTouchEnd={handleScoreCommit}
              disabled={isPending}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-xs text-gray-400">100</span>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Recomendado: 70+ para equilibrio entre qualidade e conversao
          </p>
        </div>
      )}

      {/* Mensagem de feedback */}
      {message && (
        <div
          className={`mt-3 text-xs font-medium ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Salvando...
        </div>
      )}
    </div>
  );
}
