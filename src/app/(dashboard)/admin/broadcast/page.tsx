'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Button, Input } from '@/components/ui';
import {
  countRecipients,
  sendBroadcast,
  sendTestBroadcast,
  fetchBroadcastHistory,
  type AudienceFilter,
  type BroadcastRecord,
} from '@/actions/broadcast-admin';

type FilterType = AudienceFilter['type'];

export default function AdminBroadcastPage() {
  // Form state
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDays, setFilterDays] = useState(30);
  const [filterMinHearts, setFilterMinHearts] = useState(10);

  // UI state
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countingRecipients, setCountingRecipients] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<string | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Test email
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

  const buildFilter = useCallback((): AudienceFilter => {
    switch (filterType) {
      case 'recent_days':
        return { type: 'recent_days', days: filterDays };
      case 'min_hearts':
        return { type: 'min_hearts', minHearts: filterMinHearts };
      case 'onboarding_completed':
        return { type: 'onboarding_completed' };
      case 'onboarding_not_completed':
        return { type: 'onboarding_not_completed' };
      default:
        return { type: 'all' };
    }
  }, [filterType, filterDays, filterMinHearts]);

  // Count recipients when filter changes
  useEffect(() => {
    const timeout = setTimeout(async () => {
      setCountingRecipients(true);
      setRecipientCount(null);
      const result = await countRecipients(buildFilter());
      setRecipientCount(result.count);
      setCountingRecipients(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [buildFilter]);

  // Load history
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    const result = await fetchBroadcastHistory();
    setHistory(result.data);
    setLoadingHistory(false);
  };

  const handleSend = async () => {
    if (!confirmSend) {
      setConfirmSend(true);
      return;
    }

    setError(null);
    setSuccess(null);
    setSending(true);
    setSendProgress('Enviando emails...');

    const result = await sendBroadcast({
      subject,
      title,
      message,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      filter: buildFilter(),
    });

    setSending(false);
    setSendProgress(null);
    setConfirmSend(false);

    if (result.success) {
      setSuccess(`✅ ${result.sent} de ${result.total} emails enviados com sucesso!`);
      // Reset form
      setSubject('');
      setTitle('');
      setMessage('');
      setCtaText('');
      setCtaUrl('');
    } else {
      setError(result.error || 'Erro ao enviar broadcast');
    }
  };

  const canSend = subject.trim() && title.trim() && message.trim() && recipientCount && recipientCount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast de Email"
        description="Envie emails em massa para os usuários da plataforma"
      />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {success && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-green-700">{success}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('compose')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'compose'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ✍️ Compor Email
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📋 Histórico
          </button>
        </nav>
      </div>

      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Compositor */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📧 Compositor</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assunto do email *
                  </label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Novidades da Arena Te Amo!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título / Saudação *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Olá, comunidade!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem * <span className="text-xs text-gray-400">(suporta HTML básico)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    placeholder="Escreva a mensagem do email aqui...&#10;&#10;Você pode usar <b>negrito</b>, <i>itálico</i>, <br> para quebra de linha, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Texto do CTA
                    </label>
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Acessar a Arena"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL do CTA
                    </label>
                    <Input
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://comunidade.omocodoteamo.com.br"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Filtros */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Público-alvo</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'all'}
                    onChange={() => setFilterType('all')}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Todos os usuários</p>
                    <p className="text-xs text-gray-500">Enviar para toda a base</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'recent_days'}
                    onChange={() => setFilterType('recent_days')}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Cadastrados recentemente</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Últimos</span>
                      <input
                        type="number"
                        value={filterDays}
                        onChange={(e) => setFilterDays(parseInt(e.target.value) || 7)}
                        className="w-16 px-2 py-1 text-xs border rounded"
                        min={1}
                        disabled={filterType !== 'recent_days'}
                      />
                      <span className="text-xs text-gray-500">dias</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'min_hearts'}
                    onChange={() => setFilterType('min_hearts')}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Com mais de X corações</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Mínimo</span>
                      <input
                        type="number"
                        value={filterMinHearts}
                        onChange={(e) => setFilterMinHearts(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-xs border rounded"
                        min={1}
                        disabled={filterType !== 'min_hearts'}
                      />
                      <span className="text-xs text-gray-500">❤️</span>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'onboarding_completed'}
                    onChange={() => setFilterType('onboarding_completed')}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Completaram onboarding</p>
                    <p className="text-xs text-gray-500">Usuários que concluíram a introdução</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="filter"
                    checked={filterType === 'onboarding_not_completed'}
                    onChange={() => setFilterType('onboarding_not_completed')}
                    className="text-pink-500 focus:ring-pink-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">NÃO completaram onboarding</p>
                    <p className="text-xs text-gray-500">Usuários que ainda não fizeram a introdução</p>
                  </div>
                </label>
              </div>

              {/* Contagem de destinatários */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-gray-600">Destinatários:</span>
                <span className="text-lg font-bold text-pink-600">
                  {countingRecipients ? (
                    <span className="text-gray-400 text-sm">contando...</span>
                  ) : recipientCount !== null ? (
                    `${recipientCount} usuário${recipientCount !== 1 ? 's' : ''}`
                  ) : (
                    '—'
                  )}
                </span>
              </div>
            </Card>

            {/* Enviar Teste */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Enviar Teste</h2>
              <p className="text-sm text-gray-500 mb-3">
                Envie o email pra um endereço de teste antes de disparar pra todo mundo.
              </p>
              <div className="flex gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  disabled={!testEmail.trim() || !subject.trim() || !title.trim() || !message.trim() || sendingTest}
                  onClick={async () => {
                    setSendingTest(true);
                    setTestResult(null);
                    const result = await sendTestBroadcast({
                      subject,
                      title,
                      message,
                      ctaText: ctaText || undefined,
                      ctaUrl: ctaUrl || undefined,
                      testEmail: testEmail.trim(),
                    });
                    setSendingTest(false);
                    setTestResult(result.success ? `✅ Teste enviado para ${testEmail}` : `❌ ${result.error}`);
                  }}
                >
                  {sendingTest ? 'Enviando...' : 'Enviar teste'}
                </Button>
              </div>
              {testResult && (
                <p className={`text-sm mt-2 ${testResult.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult}
                </p>
              )}
            </Card>

            {/* Enviar */}
            <Card className="p-6">
              {confirmSend ? (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium">⚠️ Confirmar envio</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Você está prestes a enviar <strong>{recipientCount}</strong> email(s) com o assunto &quot;{subject}&quot;.
                      Esta ação não pode ser desfeita.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmSend(false)}
                      disabled={sending}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSend}
                      isLoading={sending}
                      disabled={sending}
                      className="flex-1"
                    >
                      {sending ? sendProgress || 'Enviando...' : '🚀 Confirmar Envio'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={!canSend || sending}
                  fullWidth
                >
                  📨 Enviar Broadcast ({recipientCount || 0} destinatários)
                </Button>
              )}
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">👁️ Preview do Email</h3>
            <div className="border rounded-lg overflow-hidden shadow-lg sticky top-4">
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-6 text-center">
                <h1 className="text-white text-xl font-bold">❤️ Arena Te Amo</h1>
              </div>

              {/* Content */}
              <div className="bg-white p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  <strong>Assunto:</strong> {subject || <span className="italic text-gray-300">Sem assunto</span>}
                </p>
                <hr />
                <h2 className="text-xl font-semibold text-gray-900">
                  {title || <span className="italic text-gray-300">Sem título</span>}
                </h2>
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: message || '<span class="italic text-gray-300">Sem mensagem</span>',
                  }}
                />
                {ctaText && ctaUrl && (
                  <div className="text-center py-4">
                    <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-semibold">
                      {ctaText}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 text-center border-t">
                <p className="text-gray-500 text-sm">
                  Com carinho,<br />
                  <strong className="text-pink-500">Equipe Arena Te Amo</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {loadingHistory ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">Carregando histórico...</p>
            </Card>
          ) : history.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-4xl mb-3">📭</div>
              <h3 className="text-lg font-semibold text-gray-900">Nenhum broadcast enviado</h3>
              <p className="text-sm text-gray-500 mt-1">Os broadcasts enviados aparecerão aqui.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {history.map((broadcast) => (
                <Card key={broadcast.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{broadcast.subject}</h3>
                      <p className="text-sm text-gray-500 mt-1 truncate">{broadcast.title}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        <span>📅 {new Date(broadcast.created_at).toLocaleString('pt-BR')}</span>
                        <span>🎯 {broadcast.audience_filter}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-lg font-bold text-pink-600">
                        {broadcast.sent_count}/{broadcast.recipients_count}
                      </p>
                      <p className="text-xs text-gray-500">enviados</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
