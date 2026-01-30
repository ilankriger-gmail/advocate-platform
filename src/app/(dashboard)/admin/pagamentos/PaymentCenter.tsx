'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { approveClaim, rejectClaim, uploadPaymentReceipt } from '@/actions/rewards-admin';

export interface ClaimData {
  id: string;
  userId: string;
  status: string;
  coinsSpent: number;
  createdAt: string;
  deliveryAddress: Record<string, unknown> | null;
  notes: string | null;
  rewardName: string;
  rewardType: string;
  rewardImageUrl: string | null;
  rewardCoinsRequired: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  userAvatarUrl: string | null;
  userBalance: number;
  receiptUrl: string | null;
}

type TabFilter = 'pending' | 'pix-ready' | 'physical' | 'approved' | 'delivered' | 'all';

export function PaymentCenter({ claims }: { claims: ClaimData[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabFilter>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter claims by tab
  const filteredClaims = useMemo(() => {
    let filtered = claims;
    
    switch (activeTab) {
      case 'pending':
        filtered = claims.filter(c => c.status === 'pending');
        break;
      case 'pix-ready':
        filtered = claims.filter(c => c.status === 'pending' && (c.rewardType === 'money' || c.deliveryAddress?.pix_key));
        break;
      case 'physical':
        filtered = claims.filter(c => c.status === 'pending' && c.rewardType === 'physical');
        break;
      case 'approved':
        filtered = claims.filter(c => ['approved', 'shipped'].includes(c.status));
        break;
      case 'delivered':
        filtered = claims.filter(c => c.status === 'delivered');
        break;
      case 'all':
        filtered = claims;
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.userName.toLowerCase().includes(q) ||
        c.userEmail.toLowerCase().includes(q) ||
        c.rewardName.toLowerCase().includes(q) ||
        (c.deliveryAddress?.pix_key as string || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [claims, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = claims.filter(c => c.status === 'pending');
    const pixPending = pending.filter(c => c.rewardType === 'money' || c.deliveryAddress?.pix_key);
    const physicalPending = pending.filter(c => c.rewardType === 'physical');
    const digitalPending = pending.filter(c => c.rewardType === 'digital' && !c.deliveryAddress?.pix_key);
    const delivered = claims.filter(c => c.status === 'delivered');
    const approved = claims.filter(c => ['approved', 'shipped'].includes(c.status));

    return {
      totalPending: pending.length,
      pixPending: pixPending.length,
      physicalPending: physicalPending.length,
      digitalPending: digitalPending.length,
      delivered: delivered.length,
      approved: approved.length,
      totalClaims: claims.length,
    };
  }, [claims]);

  // Copy PIX key
  const copyToClipboard = useCallback(async (text: string, claimId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(claimId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(claimId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Select all visible
  const selectAll = useCallback(() => {
    if (selectedIds.size === filteredClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClaims.map(c => c.id)));
    }
  }, [filteredClaims, selectedIds.size]);

  // Approve single
  const handleApprove = useCallback(async (claimId: string) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    try {
      const result = await approveClaim(claimId);
      if (!result.success) {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Erro inesperado`);
    }
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(claimId);
      return next;
    });
    router.refresh();
  }, [router]);

  // Batch approve
  const handleBatchApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(
      `Aprovar ${selectedIds.size} resgate(s) de uma vez?\n\n` +
      `PIX → marcados como "entregue" automaticamente\n` +
      `Físicos → marcados como "aprovado" (precisa enviar)\n\n` +
      `Posts de celebração serão criados e emails enviados.`
    );
    if (!confirmed) return;

    setBatchProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const id of selectedIds) {
      setProcessingIds(prev => new Set(prev).add(id));
      try {
        const result = await approveClaim(id);
        if (result.success) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    setBatchProcessing(false);
    setSelectedIds(new Set());
    alert(`✅ ${successCount} aprovado(s)${errorCount > 0 ? `, ❌ ${errorCount} erro(s)` : ''}`);
    router.refresh();
  }, [selectedIds, router]);

  // Export CSV
  const exportCSV = useCallback(() => {
    const rows = filteredClaims.map(c => {
      const addr = c.deliveryAddress || {};
      return {
        'Nome': c.userName,
        'Email': c.userEmail,
        'Telefone': c.userPhone,
        'Prêmio': c.rewardName,
        'Tipo': c.rewardType,
        'Corações': c.coinsSpent,
        'Status': c.status,
        'Data': new Date(c.createdAt).toLocaleDateString('pt-BR'),
        'PIX Tipo': (addr.pix_key_type as string) || '',
        'PIX Chave': (addr.pix_key as string) || '',
        'PIX Nome': (addr.recipient_name as string) || '',
        'Endereço': addr.street ? `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}` : '',
        'Bairro': (addr.neighborhood as string) || '',
        'Cidade': (addr.city as string) || '',
        'UF': (addr.state as string) || '',
        'CEP': (addr.zip_code as string) || (addr.cep as string) || '',
        'Tamanho': (addr.size as string) || '',
        'Cor': (addr.color as string) || '',
        'Comprovante': c.receiptUrl || '',
      };
    });

    if (rows.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = String(row[h as keyof typeof row] || '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredClaims, activeTab]);

  // Upload receipt
  const handleReceiptUpload = useCallback(async (claimId: string, file: File) => {
    setProcessingIds(prev => new Set(prev).add(claimId));
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const result = await uploadPaymentReceipt(claimId, base64);
      if (!result.success) {
        alert(`❌ Erro ao enviar comprovante: ${result.error}`);
      }
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(claimId);
        return next;
      });
      router.refresh();
    };
    reader.readAsDataURL(file);
  }, [router]);

  const tabs: { key: TabFilter; label: string; count: number; color: string }[] = [
    { key: 'pending', label: '⏳ Pendentes', count: stats.totalPending, color: 'yellow' },
    { key: 'pix-ready', label: '💵 PIX', count: stats.pixPending, color: 'green' },
    { key: 'physical', label: '📦 Físicos', count: stats.physicalPending, color: 'blue' },
    { key: 'approved', label: '✅ Aprovados', count: stats.approved, color: 'purple' },
    { key: 'delivered', label: '🎉 Entregues', count: stats.delivered, color: 'emerald' },
    { key: 'all', label: '📋 Todos', count: stats.totalClaims, color: 'gray' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💳 Central de Pagamentos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Processe resgates de prêmios em lote • Deadline: <strong className="text-red-600">01/fev 18h</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportCSV} size="sm" variant="outline">
            📥 Exportar CSV
          </Button>
          <Button onClick={() => router.refresh()} size="sm" variant="outline">
            🔄 Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-2 border-yellow-300 bg-yellow-50">
          <p className="text-3xl font-bold text-yellow-700">{stats.totalPending}</p>
          <p className="text-sm text-yellow-600 font-medium">Pendentes</p>
        </Card>
        <Card className="p-4 border-2 border-green-300 bg-green-50">
          <p className="text-3xl font-bold text-green-700">{stats.pixPending}</p>
          <p className="text-sm text-green-600 font-medium">PIX a pagar</p>
        </Card>
        <Card className="p-4 border-2 border-blue-300 bg-blue-50">
          <p className="text-3xl font-bold text-blue-700">{stats.physicalPending}</p>
          <p className="text-sm text-blue-600 font-medium">Físicos a enviar</p>
        </Card>
        <Card className="p-4 border-2 border-emerald-300 bg-emerald-50">
          <p className="text-3xl font-bold text-emerald-700">{stats.delivered}</p>
          <p className="text-sm text-emerald-600 font-medium">Entregues</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? `bg-${tab.color}-100 text-${tab.color}-800 ring-2 ring-${tab.color}-300`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label} <span className="ml-1 font-bold">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Batch Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Buscar por nome, email, prêmio ou chave PIX..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
        />
        {(activeTab === 'pending' || activeTab === 'pix-ready' || activeTab === 'physical') && filteredClaims.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              {selectedIds.size === filteredClaims.length ? '☐ Desmarcar' : '☑️ Selecionar todos'}
            </button>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBatchApprove}
                disabled={batchProcessing}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {batchProcessing ? '⏳ Processando...' : `✅ Aprovar ${selectedIds.size} selecionado(s)`}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">{activeTab === 'delivered' ? '🎉' : '📭'}</div>
            <p className="text-gray-500">
              {activeTab === 'delivered' ? 'Nenhum resgate entregue ainda' : 'Nenhum resgate nesta categoria'}
            </p>
          </Card>
        ) : (
          filteredClaims.map(claim => (
            <ClaimCard
              key={claim.id}
              claim={claim}
              isSelected={selectedIds.has(claim.id)}
              isProcessing={processingIds.has(claim.id)}
              isCopied={copiedId === claim.id}
              onToggleSelect={() => toggleSelect(claim.id)}
              onCopy={copyToClipboard}
              onApprove={() => handleApprove(claim.id)}
              onReject={async (reason) => {
                const result = await rejectClaim(claim.id, reason);
                if (!result.success) alert(`❌ ${result.error}`);
                router.refresh();
              }}
              onUploadReceipt={(file) => handleReceiptUpload(claim.id, file)}
              showCheckbox={activeTab === 'pending' || activeTab === 'pix-ready' || activeTab === 'physical'}
            />
          ))
        )}
      </div>

      {/* Footer summary */}
      {filteredClaims.length > 0 && (
        <div className="text-center text-sm text-gray-500 py-4">
          Mostrando {filteredClaims.length} resgate(s) • Total geral: {stats.totalClaims}
        </div>
      )}
    </div>
  );
}

// ─── Claim Card Component ───────────────────────────────────────────

function ClaimCard({
  claim,
  isSelected,
  isProcessing,
  isCopied,
  onToggleSelect,
  onCopy,
  onApprove,
  onReject,
  onUploadReceipt,
  showCheckbox,
}: {
  claim: ClaimData;
  isSelected: boolean;
  isProcessing: boolean;
  isCopied: boolean;
  onToggleSelect: () => void;
  onCopy: (text: string, id: string) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onUploadReceipt: (file: File) => void;
  showCheckbox: boolean;
}) {
  const addr = claim.deliveryAddress || {};
  const pixKey = (addr.pix_key as string) || '';
  const pixKeyType = (addr.pix_key_type as string) || '';
  const recipientName = (addr.recipient_name as string) || '';
  const isPix = claim.rewardType === 'money' || pixKey.length > 0;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    approved: 'bg-blue-100 text-blue-800 border-blue-300',
    shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusLabels: Record<string, string> = {
    pending: '⏳ Pendente',
    approved: '✅ Aprovado',
    shipped: '📦 Enviado',
    delivered: '🎉 Entregue',
    rejected: '❌ Rejeitado',
  };

  const typeIcons: Record<string, string> = {
    money: '💵',
    physical: '📦',
    digital: '🎮',
  };

  return (
    <Card className={`p-4 transition-all ${isSelected ? 'ring-2 ring-purple-400 bg-purple-50/30' : ''} ${isProcessing ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {showCheckbox && claim.status === 'pending' && (
          <button
            onClick={onToggleSelect}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 hover:border-purple-400'
            }`}
          >
            {isSelected && <span className="text-xs">✓</span>}
          </button>
        )}

        {/* Avatar */}
        <Avatar name={claim.userName} src={claim.userAvatarUrl || undefined} size="md" />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* User + Prize Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-gray-900">{claim.userName}</p>
                <Badge className={statusColors[claim.status] || 'bg-gray-100'}>
                  {statusLabels[claim.status] || claim.status}
                </Badge>
                <span className="text-lg">{typeIcons[claim.rewardType] || '🎁'}</span>
              </div>
              <p className="text-sm text-gray-500">{claim.userEmail}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium text-gray-900">{claim.rewardName}</p>
              <p className="text-xs text-gray-500">
                {claim.coinsSpent} ❤️ • {new Date(claim.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          {/* PIX Info — prominent */}
          {isPix && pixKey.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    🔑 PIX {pixKeyType?.toUpperCase()} — {recipientName}
                  </p>
                  <p className="font-mono text-sm font-bold text-green-900 break-all select-all">
                    {pixKey}
                  </p>
                </div>
                <button
                  onClick={() => onCopy(pixKey, claim.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                    isCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-green-200 text-green-800 hover:bg-green-300'
                  }`}
                >
                  {isCopied ? '✅ Copiado!' : '📋 Copiar'}
                </button>
              </div>
            </div>
          )}

          {/* Physical Address */}
          {claim.rewardType === 'physical' && !!(addr.street) && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">📦 Endereço de Entrega — {recipientName}</p>
              <p className="text-sm text-blue-900">
                {String(addr.street || '')}, {String(addr.number || '')}
                {addr.complement ? ` - ${String(addr.complement)}` : ''}
                {' • '}{String(addr.neighborhood || '')}
                {' • '}{String(addr.city || '')}/{String(addr.state || '')}
                {' • CEP: '}{String(addr.zip_code || addr.cep || '')}
              </p>
              {!!(addr.size || addr.color) && (
                <p className="text-xs text-blue-700 mt-1">
                  {addr.size ? `Tamanho: ${String(addr.size)}` : ''}
                  {addr.size && addr.color ? ' • ' : ''}
                  {addr.color ? `Cor: ${String(addr.color)}` : ''}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {claim.notes && (
            <div className="mt-2 p-2 bg-amber-50 rounded border border-amber-200 text-sm text-amber-800">
              📝 {claim.notes}
            </div>
          )}

          {/* Receipt */}
          {claim.receiptUrl && (
            <div className="mt-2 inline-flex items-center gap-2">
              <a
                href={claim.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition"
              >
                ✅ Comprovante enviado — Ver
              </a>
            </div>
          )}

          {/* Actions */}
          {claim.status === 'pending' && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <Button
                onClick={onApprove}
                disabled={isProcessing}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? '⏳...' : '✅ Aprovar'}
              </Button>
              <Button
                onClick={() => {
                  const reason = prompt('Motivo da rejeição:');
                  if (reason !== null) onReject(reason || 'Sem motivo informado');
                }}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                ❌ Rejeitar
              </Button>

              {/* Upload receipt */}
              {isPix && !claim.receiptUrl && (
                <label className="px-3 py-1.5 bg-yellow-50 border border-yellow-300 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors text-sm font-medium text-yellow-700 inline-flex items-center gap-1">
                  📸 Comprovante
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isProcessing}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) onUploadReceipt(file);
                    }}
                  />
                </label>
              )}

              {/* WhatsApp link */}
              {claim.userPhone && (
                <a
                  href={`https://wa.me/${claim.userPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Oi ${claim.userName.split(' ')[0]}! 👋 Sobre o seu resgate "${claim.rewardName}" na Arena Te Amo...`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium text-emerald-700"
                >
                  💬 WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
