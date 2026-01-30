'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { ClaimActions } from '../premios/RewardAdminComponents';
import {
  saveClaimAdminNotes,
  saveClaimTrackingCode,
} from '@/actions/rewards-admin';

// Types
interface RewardData {
  id: string;
  name: string;
  description?: string;
  coins_required: number;
  type: string;
  image_url?: string;
}

interface ClaimData {
  id: string;
  user_id: string;
  reward_id: string;
  status: string;
  coins_spent: number;
  challenge_coins_spent?: number;
  engagement_coins_spent?: number;
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
  tracking_code?: string;
  notes?: string;
  delivery_address?: Record<string, string>;
  rewards: RewardData | null;
}

interface UserData {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
}

interface ProfileData {
  id: string;
  full_name?: string;
  avatar_url?: string;
}

interface ChallengeData {
  id: string;
  user_id: string;
  status: string;
  video_proof_url?: string;
  social_media_url?: string;
  instagram_proof_url?: string;
  coins_earned?: number;
  ai_is_valid?: boolean;
  ai_reason?: string;
  challenges: { title: string; type: string; icon: string } | null;
}

interface ResgatesClientProps {
  claims: ClaimData[];
  users: UserData[];
  profiles: ProfileData[];
  userCoins: { user_id: string; balance: number }[];
  challenges: ChallengeData[];
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'shipped' | 'delivered' | 'rejected';
type TypeFilter = 'all' | 'money' | 'physical' | 'digital';

const statusConfig: Record<string, { label: string; emoji: string; color: string; bgColor: string; textColor: string }> = {
  pending: { label: 'Pendente', emoji: '⏳', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' },
  approved: { label: 'Aprovado', emoji: '✅', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
  shipped: { label: 'Enviado', emoji: '📦', color: 'bg-purple-500', bgColor: 'bg-purple-50', textColor: 'text-purple-700' },
  delivered: { label: 'Entregue', emoji: '🎉', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' },
  rejected: { label: 'Rejeitado', emoji: '❌', color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
};

const typeConfig: Record<string, { label: string; emoji: string }> = {
  money: { label: 'PIX', emoji: '💵' },
  physical: { label: 'Físico', emoji: '📦' },
  digital: { label: 'Digital', emoji: '🎮' },
};

export default function ResgatesClient({ claims, users, profiles, userCoins, challenges }: ResgatesClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClaim, setExpandedClaim] = useState<string | null>(null);

  // Build lookup maps
  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const profilesMap = useMemo(() => new Map(profiles.map(p => [p.id, p])), [profiles]);
  const coinsMap = useMemo(() => new Map(userCoins.map(c => [c.user_id, c.balance])), [userCoins]);
  const challengesMap = useMemo(() => {
    const map = new Map<string, ChallengeData[]>();
    challenges.forEach(c => {
      const list = map.get(c.user_id) || [];
      list.push(c);
      map.set(c.user_id, list);
    });
    return map;
  }, [challenges]);

  // Get display name for a user
  const getDisplayName = useCallback((userId: string) => {
    const profile = profilesMap.get(userId);
    const user = usersMap.get(userId);
    return profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário';
  }, [profilesMap, usersMap]);

  const getAvatarUrl = useCallback((userId: string) => {
    return profilesMap.get(userId)?.avatar_url || usersMap.get(userId)?.avatar_url;
  }, [profilesMap, usersMap]);

  // Filter claims
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      // Status filter
      if (statusFilter !== 'all' && claim.status !== statusFilter) return false;
      // Type filter
      if (typeFilter !== 'all') {
        const reward = claim.rewards;
        if (!reward || reward.type !== typeFilter) return false;
      }
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const displayName = getDisplayName(claim.user_id).toLowerCase();
        const email = usersMap.get(claim.user_id)?.email?.toLowerCase() || '';
        const rewardName = claim.rewards?.name?.toLowerCase() || '';
        const claimId = claim.id.toLowerCase();
        return displayName.includes(query) || email.includes(query) || rewardName.includes(query) || claimId.startsWith(query);
      }
      return true;
    });
  }, [claims, statusFilter, typeFilter, searchQuery, getDisplayName, usersMap]);

  // Stats
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalCoins = 0;
    claims.forEach(c => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      const t = c.rewards?.type || 'unknown';
      byType[t] = (byType[t] || 0) + 1;
      if (c.status !== 'rejected' && c.status !== 'cancelled') {
        totalCoins += c.coins_spent || 0;
      }
    });
    return { byStatus, byType, totalCoins, total: claims.length };
  }, [claims]);

  // CSV export
  const handleExportCSV = () => {
    const rows = filteredClaims.map(claim => {
      const user = usersMap.get(claim.user_id);
      const profile = profilesMap.get(claim.user_id);
      const reward = claim.rewards;
      const addr = claim.delivery_address || {};
      return {
        id: claim.id.slice(0, 8),
        status: statusConfig[claim.status]?.label || claim.status,
        usuario: profile?.full_name || user?.full_name || '',
        email: user?.email || '',
        telefone: user?.phone || '',
        premio: reward?.name || '',
        tipo: reward?.type || '',
        coracoes: claim.coins_spent,
        data: new Date(claim.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
        pix_nome: (addr as Record<string, string>).recipient_name || '',
        pix_tipo: (addr as Record<string, string>).pix_key_type || '',
        pix_chave: (addr as Record<string, string>).pix_key || '',
        endereco: (addr as Record<string, string>).street ? `${(addr as Record<string, string>).street}, ${(addr as Record<string, string>).number}` : '',
        cidade: (addr as Record<string, string>).city || '',
        estado: (addr as Record<string, string>).state || '',
        cep: (addr as Record<string, string>).cep || (addr as Record<string, string>).zip_code || '',
        tamanho: (addr as Record<string, string>).size || '',
        cor: (addr as Record<string, string>).color || '',
        rastreio: claim.tracking_code || '',
        notas_admin: claim.admin_notes || '',
      };
    });

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const val = String((r as Record<string, unknown>)[h] || '');
        return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resgates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Resgates</h1>
          <p className="text-gray-500 text-sm mt-1">
            {stats.total} resgates • {stats.totalCoins.toLocaleString()} ❤️ total gastos
          </p>
        </div>
        <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2">
          📥 Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {(['pending', 'approved', 'shipped', 'delivered', 'rejected'] as const).map(status => {
          const config = statusConfig[status];
          const count = stats.byStatus[status] || 0;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                isActive
                  ? `${config.bgColor} border-current ${config.textColor} shadow-md`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-3 h-3 ${config.color} rounded-full mx-auto mb-2 ${status === 'pending' && count > 0 ? 'animate-pulse' : ''}`}></div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500">{config.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por nome, email, prêmio ou ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl bg-white text-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-400 outline-none"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>

        {/* Type filter */}
        <div className="flex gap-2">
          {(['all', 'money', 'physical', 'digital'] as const).map(type => {
            const isActive = typeFilter === type;
            const config = type === 'all' ? { label: 'Todos', emoji: '📋' } : typeConfig[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(isActive && type !== 'all' ? 'all' : type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
                }`}
              >
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>

        {/* Active filters indicator */}
        {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setSearchQuery(''); }}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Mostrando {filteredClaims.length} de {claims.length} resgates
      </p>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.map(claim => {
          const reward = claim.rewards;
          const displayName = getDisplayName(claim.user_id);
          const avatarUrl = getAvatarUrl(claim.user_id);
          const userEmail = usersMap.get(claim.user_id)?.email || '';
          const userPhone = usersMap.get(claim.user_id)?.phone || '';
          const userBalance = coinsMap.get(claim.user_id) ?? 0;
          const config = statusConfig[claim.status] || statusConfig.pending;
          const isExpanded = expandedClaim === claim.id;
          const addr = (claim.delivery_address || {}) as Record<string, string>;
          const isPix = reward?.type === 'money' || !!addr.pix_key;

          return (
            <Card key={claim.id} className={`overflow-hidden border-l-4 ${
              claim.status === 'pending' ? 'border-l-yellow-400' :
              claim.status === 'approved' ? 'border-l-blue-400' :
              claim.status === 'shipped' ? 'border-l-purple-400' :
              claim.status === 'delivered' ? 'border-l-green-400' :
              'border-l-red-400'
            }`}>
              {/* Main Row - Always Visible */}
              <button
                onClick={() => setExpandedClaim(isExpanded ? null : claim.id)}
                className="w-full p-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar + User */}
                  <Avatar name={displayName} src={avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{displayName}</p>
                      <Badge className={`${config.bgColor} ${config.textColor} text-xs`}>
                        {config.emoji} {config.label}
                      </Badge>
                      {reward?.type && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          {typeConfig[reward.type]?.emoji || '📋'} {typeConfig[reward.type]?.label || reward.type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-0.5">
                      {reward?.name} • {claim.coins_spent} ❤️ • {new Date(claim.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  {/* Actions (stop propagation) */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <ClaimActions claim={claim} rewardType={reward?.type} />
                  </div>
                  {/* Expand indicator */}
                  <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                  {/* User info row */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-gray-500">📧 {userEmail}</span>
                    {userPhone && <span className="text-gray-500">📱 {userPhone}</span>}
                    <span className="text-gray-500">❤️ {userBalance} corações</span>
                    <Link href={`/admin/usuarios/${claim.user_id}`} className="text-purple-600 hover:underline font-medium">
                      📜 Ver perfil
                    </Link>
                    <span className="text-gray-400">ID: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{claim.id.slice(0, 8)}</code></span>
                  </div>

                  {/* Reward detail */}
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-3">
                      {reward?.image_url && (
                        <img src={reward.image_url} alt={reward.name} className="w-14 h-14 rounded-lg object-cover border" />
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{reward?.name}</p>
                        {reward?.description && <p className="text-sm text-gray-600 mt-0.5">{reward.description}</p>}
                        <p className="text-xs text-gray-500 mt-1">
                          Custo: {claim.coins_spent} ❤️
                          {claim.engagement_coins_spent ? ` (${claim.engagement_coins_spent} engajamento` : ''}
                          {claim.challenge_coins_spent ? ` + ${claim.challenge_coins_spent} desafio)` : claim.engagement_coins_spent ? ')' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PIX data */}
                  {isPix && addr.pix_key && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm">
                      <p className="font-semibold text-green-700 mb-2">🔑 Dados PIX</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Nome:</span>{' '}
                          <span className="font-medium text-gray-900">{addr.recipient_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tipo:</span>{' '}
                          <span className="font-medium text-gray-900">{addr.pix_key_type?.toUpperCase()}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-500">Chave:</span>
                          <p className="font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded border mt-1 select-all cursor-pointer"
                             onClick={() => navigator.clipboard.writeText(addr.pix_key || '')}
                             title="Clique para copiar">
                            {addr.pix_key} 📋
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Physical delivery address */}
                  {addr.street && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                      <p className="font-semibold text-blue-700 mb-2">📦 Endereço de Entrega</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="sm:col-span-2">
                          <span className="text-gray-500">Destinatário:</span>{' '}
                          <span className="font-medium">{addr.recipient_name}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-gray-500">Endereço:</span>{' '}
                          <span className="font-medium">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ''}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bairro:</span> <span className="font-medium">{addr.neighborhood}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Cidade/UF:</span> <span className="font-medium">{addr.city}/{addr.state}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">CEP:</span> <span className="font-mono font-medium">{addr.cep || addr.zip_code}</span>
                        </div>
                        {addr.size && <div><span className="text-gray-500">Tamanho:</span> <span className="font-medium">{addr.size}</span></div>}
                        {addr.color && <div><span className="text-gray-500">Cor:</span> <span className="font-medium">{addr.color}</span></div>}
                      </div>
                    </div>
                  )}

                  {/* Comprovante */}
                  {addr.payment_receipt_url && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-2">✅ Comprovante de Pagamento</p>
                      <a href={addr.payment_receipt_url} target="_blank" rel="noopener noreferrer">
                        <img src={addr.payment_receipt_url} alt="Comprovante" className="max-w-xs rounded-lg border shadow-sm hover:opacity-90 transition" />
                      </a>
                    </div>
                  )}

                  {/* Tracking code */}
                  {claim.tracking_code && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-sm">
                      <p className="font-semibold text-purple-700">📦 Código de Rastreio</p>
                      <p className="font-mono font-medium text-gray-900 mt-1 select-all cursor-pointer"
                         onClick={() => navigator.clipboard.writeText(claim.tracking_code || '')}
                         title="Clique para copiar">
                        {claim.tracking_code} 📋
                      </p>
                    </div>
                  )}

                  {/* User challenges */}
                  {(challengesMap.get(claim.user_id) || []).length > 0 && (
                    <details className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <summary className="text-sm font-semibold text-indigo-700 cursor-pointer">
                        🏆 Desafios ({(challengesMap.get(claim.user_id) || []).length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {(challengesMap.get(claim.user_id) || []).slice(0, 10).map((ch) => {
                          const challenge = ch.challenges;
                          return (
                            <div key={ch.id} className="flex items-center gap-2 text-sm p-1.5 bg-white rounded">
                              <span>{challenge?.icon || '🎯'}</span>
                              <span className="text-gray-700 truncate flex-1">{challenge?.title}</span>
                              <Badge className={ch.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                {ch.status}
                              </Badge>
                              {ch.video_proof_url && (
                                <a href={ch.video_proof_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">🎥</a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {/* Admin tools */}
                  <div className="flex gap-3 flex-wrap">
                    {/* Admin notes */}
                    <AdminNotesInput claimId={claim.id} initialNotes={claim.admin_notes || ''} />
                    {/* Tracking code input */}
                    {(claim.status === 'approved' || claim.status === 'shipped') && reward?.type === 'physical' && (
                      <TrackingCodeInput claimId={claim.id} initialCode={claim.tracking_code || ''} />
                    )}
                  </div>

                  {/* User notes */}
                  {claim.notes && (
                    <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                      <span className="text-blue-700 font-medium">📝 Nota do usuário:</span> {claim.notes}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {filteredClaims.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-5xl mb-4">{searchQuery ? '🔍' : '📭'}</div>
            <p className="text-gray-500">
              {searchQuery ? 'Nenhum resgate encontrado para essa busca' : 'Nenhum resgate ainda'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

// === Sub-components ===

function AdminNotesInput({ claimId, initialNotes }: { claimId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveClaimAdminNotes(claimId, notes);
    if (result.success) {
      setIsEditing(false);
    } else {
      alert(result.error || 'Erro ao salvar');
    }
    setIsSaving(false);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
      >
        {notes ? `📝 ${notes.slice(0, 40)}${notes.length > 40 ? '...' : ''}` : '📝 Adicionar nota admin'}
      </button>
    );
  }

  return (
    <div className="flex-1 min-w-[250px]">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nota interna (só admin vê)..."
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <Button onClick={handleSave} size="sm" disabled={isSaving}>
          {isSaving ? '...' : '💾'}
        </Button>
        <button onClick={() => { setIsEditing(false); setNotes(initialNotes); }} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>
    </div>
  );
}

function TrackingCodeInput({ claimId, initialCode }: { claimId: string; initialCode: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!code.trim()) return;
    setIsSaving(true);
    const result = await saveClaimTrackingCode(claimId, code.trim());
    if (result.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert(result.error || 'Erro ao salvar');
    }
    setIsSaving(false);
  };

  if (!isEditing && initialCode) {
    return (
      <span className="text-sm text-purple-600 px-3 py-2">
        📦 {initialCode}
      </span>
    );
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-sm text-purple-500 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
      >
        📦 Adicionar rastreio
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de rastreio..."
        className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-300 outline-none"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
      <Button onClick={handleSave} size="sm" disabled={isSaving}>
        {isSaving ? '...' : '📦 Salvar'}
      </Button>
      <button onClick={() => { setIsEditing(false); setCode(initialCode); }} className="text-gray-400 hover:text-gray-600">✕</button>
    </div>
  );
}
