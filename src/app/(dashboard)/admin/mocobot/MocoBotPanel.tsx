'use client';

import { useState, useTransition } from 'react';
import { saveMocoBotConfig, processQueueNow } from '@/actions/mocobot-config';
import type { MocoBotConfig, BotStats, RecentAction } from '@/actions/mocobot-config';

interface Props {
  config: MocoBotConfig;
  stats: BotStats;
  recentActions: RecentAction[];
}

function formatDelay(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function msToMinutes(ms: number): number {
  return Math.round(ms / 60000);
}

function minutesToMs(min: number): number {
  return min * 60000;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

const ACTION_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  like: { icon: '❤️', label: 'Curtida', color: 'text-pink-600' },
  comment: { icon: '💬', label: 'Comentário', color: 'text-blue-600' },
  reply: { icon: '↩️', label: 'Resposta', color: 'text-purple-600' },
};

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendente' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Concluído' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Falhou' },
};

export default function MocoBotPanel({ config: initialConfig, stats, recentActions }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, startSaving] = useTransition();
  const [processing, startProcessing] = useTransition();
  const [saveMsg, setSaveMsg] = useState('');
  const [processMsg, setProcessMsg] = useState('');

  const handleSave = () => {
    startSaving(async () => {
      setSaveMsg('');
      const result = await saveMocoBotConfig(config);
      setSaveMsg(result.success ? '✅ Configurações salvas!' : `❌ ${result.error}`);
      setTimeout(() => setSaveMsg(''), 3000);
    });
  };

  const handleProcessQueue = () => {
    startProcessing(async () => {
      setProcessMsg('');
      const result = await processQueueNow();
      if (result.success && result.result) {
        const r = result.result;
        setProcessMsg(`✅ Processado: ${r.processed} ações (${r.likes} curtidas, ${r.comments} comentários, ${r.replies} respostas, ${r.errors} erros)`);
      } else {
        setProcessMsg(`❌ ${result.error}`);
      }
      setTimeout(() => setProcessMsg(''), 5000);
    });
  };

  const toggleBot = () => {
    const newConfig = { ...config, enabled: !config.enabled };
    setConfig(newConfig);
    startSaving(async () => {
      const result = await saveMocoBotConfig(newConfig);
      if (!result.success) {
        setConfig(config); // revert
        setSaveMsg(`❌ ${result.error}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🤖 MocoBot
          </h1>
          <p className="text-gray-500">Painel de controle do bot de interação automática</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleProcessQueue}
            disabled={processing}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-sm font-medium shadow-sm"
          >
            {processing ? '⏳ Processando...' : '⚡ Processar Fila Agora'}
          </button>
        </div>
      </div>

      {processMsg && (
        <div className={`p-3 rounded-lg text-sm ${processMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {processMsg}
        </div>
      )}

      {/* Status + Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Status Card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status</h2>
            <button
              onClick={toggleBot}
              disabled={saving}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                config.enabled ? 'translate-x-8' : 'translate-x-1'
              }`} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${config.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className={`text-lg font-bold ${config.enabled ? 'text-green-600' : 'text-gray-500'}`}>
              {config.enabled ? 'Ativo' : 'Pausado'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {config.enabled ? 'O bot está interagindo automaticamente' : 'Bot pausado - nenhuma nova ação será agendada'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="bg-white rounded-xl border-l-4 border-l-blue-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Hoje</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalToday}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-yellow-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Na fila</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-green-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Concluídos</p>
          <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
        </div>
        <div className="bg-white rounded-xl border-l-4 border-l-red-500 border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Falharam</p>
          <p className="text-2xl font-bold text-red-600">{stats.failedToday}</p>
        </div>
      </div>

      {/* Type Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">❤️</span>
            <p className="text-sm font-medium text-pink-700">Curtidas</p>
          </div>
          <p className="text-2xl font-bold text-pink-600">{stats.byType.likes}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💬</span>
            <p className="text-sm font-medium text-blue-700">Comentários</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.byType.comments}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">↩️</span>
            <p className="text-sm font-medium text-purple-700">Respostas</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.byType.replies}</p>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚙️ Configurações</h2>

        <div className="space-y-6">
          {/* Probabilities */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Probabilidades</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ❤️ Curtir Post: {Math.round(config.probCurtirPost * 100)}%
                </label>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={Math.round(config.probCurtirPost * 100)}
                  onChange={(e) => setConfig({ ...config, probCurtirPost: parseInt(e.target.value) / 100 })}
                  className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💬 Comentar Post: {Math.round(config.probComentarPost * 100)}%
                </label>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={Math.round(config.probComentarPost * 100)}
                  onChange={(e) => setConfig({ ...config, probComentarPost: parseInt(e.target.value) / 100 })}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ↩️ Responder Comentário: {Math.round(config.probResponderComment * 100)}%
                </label>
                <input
                  type="range"
                  min="0" max="100" step="5"
                  value={Math.round(config.probResponderComment * 100)}
                  onChange={(e) => setConfig({ ...config, probResponderComment: parseInt(e.target.value) / 100 })}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Delays */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Delays (minutos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">❤️ Curtida</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayCurtirMin)}
                    onChange={(e) => setConfig({ ...config, delayCurtirMin: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-gray-400">a</span>
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayCurtirMax)}
                    onChange={(e) => setConfig({ ...config, delayCurtirMax: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">💬 Comentário</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayComentarMin)}
                    onChange={(e) => setConfig({ ...config, delayComentarMin: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-gray-400">a</span>
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayComentarMax)}
                    onChange={(e) => setConfig({ ...config, delayComentarMax: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">↩️ Resposta</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayResponderMin)}
                    onChange={(e) => setConfig({ ...config, delayResponderMin: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-gray-400">a</span>
                  <input
                    type="number"
                    min="1"
                    value={msToMinutes(config.delayResponderMax)}
                    onChange={(e) => setConfig({ ...config, delayResponderMax: minutesToMs(parseInt(e.target.value) || 1) })}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 text-sm font-medium shadow-sm"
            >
              {saving ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📋 Atividade Recente</h2>

        {recentActions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhuma ação registrada ainda</p>
        ) : (
          <div className="space-y-2">
            {recentActions.map((action) => {
              const typeInfo = ACTION_ICONS[action.action_type] || { icon: '❓', label: action.action_type, color: 'text-gray-600' };
              const statusInfo = STATUS_BADGES[action.status] || STATUS_BADGES.pending;

              return (
                <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <span className="text-xl">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    {action.response_text && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        &quot;{action.response_text.substring(0, 80)}{action.response_text.length > 80 ? '...' : ''}&quot;
                      </p>
                    )}
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      <span>Agendado: {formatTime(action.scheduled_for)}</span>
                      {action.executed_at && <span>Executado: {formatTime(action.executed_at)}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 font-mono whitespace-nowrap">
                    {action.post_id.substring(0, 8)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
