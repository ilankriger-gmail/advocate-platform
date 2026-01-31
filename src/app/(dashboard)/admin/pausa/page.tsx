'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { updateSiteSetting } from '@/actions/settings';
import type { SiteSettingKey } from '@/lib/config/site';

export default function CommunityPausePage() {
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [reopenDate, setReopenDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pause-status');
      if (res.ok) {
        const data = await res.json();
        setIsPaused(data.paused);
        setMessage(data.message || '');
        setReopenDate(data.reopenDate || '');
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleTogglePause = async () => {
    const newValue = !isPaused;
    const confirmed = window.confirm(
      newValue
        ? '⚠️ ATENÇÃO: Isso vai PAUSAR a comunidade!\n\nTodos os usuários (exceto admins) serão redirecionados para a página de pausa.\n\nDeseja continuar?'
        : '✅ Isso vai REABRIR a comunidade!\n\nTodos os usuários voltarão a ter acesso normal.\n\nDeseja continuar?'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      const result = await updateSiteSetting('community_paused' as SiteSettingKey, newValue ? 'true' : 'false');
      if (result.success) {
        setIsPaused(newValue);
        setFeedback({
          type: 'success',
          text: newValue ? 'Comunidade pausada com sucesso!' : 'Comunidade reaberta com sucesso!',
        });
      } else {
        setFeedback({ type: 'error', text: result.error || 'Erro ao atualizar' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleSaveMessage = async () => {
    setSaving(true);
    try {
      const results = await Promise.all([
        updateSiteSetting('community_pause_message' as SiteSettingKey, message),
        updateSiteSetting('community_pause_reopen_date' as SiteSettingKey, reopenDate),
      ]);

      const hasError = results.find(r => !r.success);
      if (hasError) {
        setFeedback({ type: 'error', text: hasError.error || 'Erro ao salvar' });
      } else {
        setFeedback({ type: 'success', text: 'Configurações salvas!' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Erro de conexão' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⏸️ Pausa da Comunidade</h1>
        <p className="text-gray-500 mt-1">
          Controle o acesso à comunidade. Quando pausada, os usuários são redirecionados para uma página de aviso.
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg border ${
            feedback.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Status atual */}
      <Card className={`p-6 border-2 ${isPaused ? 'border-red-300 bg-red-50/50' : 'border-green-300 bg-green-50/50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              {isPaused ? (
                <>
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  Comunidade PAUSADA
                </>
              ) : (
                <>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  Comunidade ATIVA
                </>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isPaused
                ? 'Usuários estão sendo redirecionados para /pausado'
                : 'Todos os usuários têm acesso normal à comunidade'}
            </p>
          </div>
          <button
            onClick={handleTogglePause}
            disabled={saving}
            className={`px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
              isPaused
                ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-200'
                : 'bg-red-600 hover:bg-red-700 hover:shadow-red-200'
            } disabled:opacity-50`}
          >
            {saving ? '...' : isPaused ? '▶️ Reabrir' : '⏸️ Pausar'}
          </button>
        </div>
      </Card>

      {/* O que continua acessível */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-3">🔓 Acessível durante a pausa:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>⚙️</span> <span>/admin (gestão)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>🎁</span> <span>/premios (resgates)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>📩</span> <span>/newsletter</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>🔑</span> <span>/login (autenticação)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>🔗</span> <span>/api (APIs e cron)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span>📋</span> <span>/termos e /privacidade</span>
          </div>
        </div>
      </Card>

      {/* Configurações da página de pausa */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-gray-900">📝 Mensagem da Página de Pausa</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensagem para os usuários
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="A comunidade está em pausa para melhorias..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previsão de retorno (opcional)
          </label>
          <input
            type="text"
            value={reopenDate}
            onChange={e => setReopenDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
            placeholder="Ex: Fevereiro de 2026"
          />
        </div>

        <button
          onClick={handleSaveMessage}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : '💾 Salvar Configurações'}
        </button>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 mb-3">👁️ Preview da página</h3>
        <a
          href="/pausado"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          Abrir /pausado em nova aba →
        </a>
      </Card>
    </div>
  );
}
