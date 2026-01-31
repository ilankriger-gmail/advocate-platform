'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { updateSiteSetting } from '@/actions/settings';
import type { SiteSettingKey } from '@/lib/config/site';

interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  count: number;
  link: string;
  priority: 'high' | 'medium' | 'low';
}

interface ClosingSummary {
  users: { total: number; newsletterSubs: number };
  claims: {
    pending: number;
    approved: number;
    shipped: number;
    delivered: number;
    rejected: number;
    pixPending: number;
    physicalPending: number;
  };
  content: { totalPosts: number; pendingPosts: number; pendingParticipations: number };
  economy: { totalCoins: number };
  checklist: ChecklistItem[];
}

export default function CommunityPausePage() {
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [reopenDate, setReopenDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [summary, setSummary] = useState<ClosingSummary | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pauseRes, summaryRes] = await Promise.all([
        fetch('/api/admin/pause-status'),
        fetch('/api/admin/closing-summary'),
      ]);

      if (pauseRes.ok) {
        const data = await pauseRes.json();
        setIsPaused(data.paused);
        setMessage(data.message || '');
        setReopenDate(data.reopenDate || '');
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-500',
  };

  const priorityBg = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-gray-50 border-gray-200',
  };

  // Update checklist with pause status
  const checklist = summary?.checklist.map(item => {
    if (item.id === 'enable-pause') {
      return { ...item, done: isPaused };
    }
    return item;
  }) || [];

  const completedCount = checklist.filter(i => i.done).length;
  const totalCount = checklist.length;

  return (
    <div className="space-y-6 max-w-3xl">
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

      {/* Closing Checklist */}
      {summary && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-lg">📋 Checklist de Fechamento</h3>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              completedCount === totalCount 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {completedCount}/{totalCount} concluídos
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${
                completedCount === totalCount ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>

          <div className="space-y-2">
            {checklist.map(item => (
              <Link
                key={item.id}
                href={item.link}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${
                  item.done ? 'bg-green-50/50 border-green-200' : priorityBg[item.priority]
                }`}
              >
                <span className="text-lg flex-shrink-0">
                  {item.done ? '✅' : '⬜'}
                </span>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${item.done ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                  {item.count > 0 && !item.done && (
                    <span className={`ml-2 text-xs font-bold ${priorityColors[item.priority]}`}>
                      ({item.count})
                    </span>
                  )}
                </div>
                {!item.done && (
                  <span className="text-gray-400 text-sm">→</span>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.users.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Usuários</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-pink-600">{summary.economy.totalCoins.toLocaleString()}</p>
            <p className="text-xs text-gray-500">❤️ em circulação</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{summary.claims.delivered}</p>
            <p className="text-xs text-gray-500">Prêmios entregues</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.users.newsletterSubs}</p>
            <p className="text-xs text-gray-500">Newsletter</p>
          </Card>
        </div>
      )}

      {/* Claims breakdown */}
      {summary && (summary.claims.pending > 0 || summary.claims.approved > 0) && (
        <Card className="p-6 border-yellow-200 bg-yellow-50/50">
          <h3 className="font-bold text-gray-900 mb-3">⚠️ Resgates que precisam de ação</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-orange-600">{summary.claims.pending}</p>
              <p className="text-xs text-gray-500">Pendentes</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-blue-600">{summary.claims.approved}</p>
              <p className="text-xs text-gray-500">Aprovados</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-indigo-600">{summary.claims.shipped}</p>
              <p className="text-xs text-gray-500">Enviados</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-green-600">{summary.claims.delivered}</p>
              <p className="text-xs text-gray-500">Entregues</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xl font-bold text-gray-400">{summary.claims.rejected}</p>
              <p className="text-xs text-gray-500">Rejeitados</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/admin/resgates"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Ver resgates →
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin/pagamentos"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Central de pagamentos →
            </Link>
          </div>
        </Card>
      )}

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
