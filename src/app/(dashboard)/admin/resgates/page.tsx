import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, Badge, Avatar } from '@/components/ui';
import { ClaimActions } from '../premios/RewardAdminComponents';

export const dynamic = 'force-dynamic';

export default async function AdminResgatesPage() {
  const supabase = createAdminClient();

  // Buscar todos os resgates
  const { data: allClaims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        description,
        coins_required,
        type,
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  // Buscar nomes e avatares dos usuários
  const userIds = [...new Set(allClaims?.map(c => c.user_id) || [])];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, avatar_url, phone')
    .in('id', userIds);

  // Também buscar de profiles para pegar avatar e mais dados
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, bio')
    .in('id', userIds);

  // Buscar saldo de corações de cada usuário
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('user_id, balance')
    .in('user_id', userIds);

  // Buscar total de resgates por usuário
  const { data: userClaimCounts } = await supabase
    .from('reward_claims')
    .select('user_id')
    .in('user_id', userIds);

  const usersMap = new Map(users?.map(u => [u.id, u]) || []);
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
  const coinsMap = new Map(userCoins?.map(c => [c.user_id, c.balance]) || []);
  const claimCountMap = new Map<string, number>();
  userClaimCounts?.forEach(c => {
    claimCountMap.set(c.user_id, (claimCountMap.get(c.user_id) || 0) + 1);
  });

  const claimsByStatus = {
    pending: (allClaims || []).filter((c) => c.status === 'pending'),
    approved: (allClaims || []).filter((c) => c.status === 'approved'),
    shipped: (allClaims || []).filter((c) => c.status === 'shipped'),
    delivered: (allClaims || []).filter((c) => c.status === 'delivered'),
    rejected: (allClaims || []).filter((c) => c.status === 'rejected'),
  };

  const statusConfig = {
    pending: { label: 'Pendentes', color: 'bg-yellow-500', bgColor: 'bg-yellow-50 border-yellow-200' },
    approved: { label: 'Aprovados', color: 'bg-blue-500', bgColor: 'bg-blue-50 border-blue-200' },
    shipped: { label: 'Enviados', color: 'bg-purple-500', bgColor: 'bg-purple-50 border-purple-200' },
    delivered: { label: 'Entregues', color: 'bg-green-500', bgColor: 'bg-green-50 border-green-200' },
    rejected: { label: 'Rejeitados', color: 'bg-red-500', bgColor: 'bg-red-50 border-red-200' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💰 Resgates</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os pedidos de resgate dos usuários</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(claimsByStatus).map(([status, claims]) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          return (
            <Card key={status} className="p-4 text-center">
              <div className={`w-3 h-3 ${config.color} rounded-full mx-auto mb-2`}></div>
              <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
              <p className="text-sm text-gray-500">{config.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Pendentes primeiro (destaque) */}
      {claimsByStatus.pending.length > 0 && (
        <Card className="p-5 border-2 border-yellow-300 bg-yellow-50/50">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></span>
            ⚠️ Pendentes - Aguardando Ação ({claimsByStatus.pending.length})
          </h2>
          <div className="space-y-3">
            {claimsByStatus.pending.map((claim) => {
              const reward = claim.rewards as { id: string; name: string; description?: string; coins_required: number; type: string; image_url?: string } | null;
              const user = usersMap.get(claim.user_id);
              const profile = profilesMap.get(claim.user_id);
              const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário';
              const avatarUrl = profile?.avatar_url || user?.avatar_url;
              const userEmail = user?.email || '—';
              const userBalance = coinsMap.get(claim.user_id) ?? 0;
              const userTotalClaims = claimCountMap.get(claim.user_id) ?? 0;

              return (
                <div key={claim.id} className="p-5 bg-white rounded-xl border border-yellow-200 shadow-sm">
                  {/* Header: User info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar name={displayName} src={avatarUrl} size="lg" />
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{displayName}</p>
                          <p className="text-sm text-gray-500">{userEmail}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              ❤️ {userBalance} corações
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {userTotalClaims} resgate{userTotalClaims !== 1 ? 's' : ''} total
                            </span>
                            <Link href={`/admin/usuarios/${claim.user_id}`} className="text-xs text-purple-600 hover:underline font-medium">
                              📜 Ver perfil completo
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Prêmio resgatado */}
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 mb-3">
                        <div className="flex items-center gap-3">
                          {reward?.image_url && (
                            <img src={reward.image_url} alt={reward?.name} className="w-16 h-16 rounded-lg object-cover border" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 text-base">{reward?.name}</p>
                              <Badge className="bg-yellow-500 text-white">Pendente</Badge>
                              {reward?.type === 'money' && <Badge className="bg-green-600 text-white">💵 PIX</Badge>}
                              {reward?.type === 'physical' && <Badge className="bg-blue-600 text-white">📦 Físico</Badge>}
                              {reward?.type === 'digital' && <Badge className="bg-indigo-600 text-white">🎮 Digital</Badge>}
                            </div>
                            {reward?.description && (
                              <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                            )}
                            <p className="text-sm text-gray-500 mt-1">
                              Custo: <strong>{claim.coins_spent} ❤️</strong> • ID: <code className="text-xs bg-white px-1.5 py-0.5 rounded">{claim.id.slice(0, 8)}</code>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Data */}
                      <p className="text-sm text-gray-500 mb-3">
                        📅 Solicitado em{' '}
                        {new Date(claim.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Dados de entrega/PIX */}
                      {claim.delivery_address && (
                        <div className="p-4 bg-gray-50 rounded-lg border text-sm space-y-3">
                          {claim.delivery_address.pix_key && (
                            <div className="space-y-1.5">
                              <p className="font-semibold text-green-700 text-base">🔑 Dados PIX</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-gray-500">Nome:</span>
                                  <p className="font-medium text-gray-900">{claim.delivery_address.recipient_name}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Tipo:</span>
                                  <p className="font-medium text-gray-900">{claim.delivery_address.pix_key_type?.toUpperCase()}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-gray-500">Chave:</span>
                                  <p className="font-mono font-medium text-gray-900 bg-white px-3 py-1.5 rounded border mt-1 select-all">
                                    {claim.delivery_address.pix_key}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {claim.delivery_address.street && (
                            <div className="space-y-1.5">
                              <p className="font-semibold text-purple-700 text-base">📦 Endereço de Entrega</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="sm:col-span-2">
                                  <span className="text-gray-500">Destinatário:</span>
                                  <p className="font-medium text-gray-900">{claim.delivery_address.recipient_name}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-gray-500">Endereço:</span>
                                  <p className="font-medium text-gray-900">
                                    {claim.delivery_address.street}, {claim.delivery_address.number}
                                    {claim.delivery_address.complement && ` - ${claim.delivery_address.complement}`}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Bairro:</span>
                                  <p className="font-medium text-gray-900">{claim.delivery_address.neighborhood}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Cidade/UF:</span>
                                  <p className="font-medium text-gray-900">{claim.delivery_address.city}/{claim.delivery_address.state}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">CEP:</span>
                                  <p className="font-mono font-medium text-gray-900">{claim.delivery_address.zip_code || claim.delivery_address.cep}</p>
                                </div>
                                {claim.delivery_address.size && (
                                  <div>
                                    <span className="text-gray-500">Tamanho:</span>
                                    <p className="font-medium text-gray-900">{claim.delivery_address.size}</p>
                                  </div>
                                )}
                                {claim.delivery_address.color && (
                                  <div>
                                    <span className="text-gray-500">Cor:</span>
                                    <p className="font-medium text-gray-900">{claim.delivery_address.color}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notas (se existir) */}
                      {claim.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-700">📝 Observações:</p>
                          <p className="text-sm text-blue-900 mt-1">{claim.notes}</p>
                        </div>
                      )}
                    </div>

                    <ClaimActions claim={claim} rewardType={reward?.type} />
                  </div>

                  {/* Comprovante de pagamento (se já enviado) */}
                  {claim.delivery_address?.payment_receipt_url && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-2">✅ Comprovante de Pagamento</p>
                      <a href={claim.delivery_address.payment_receipt_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={claim.delivery_address.payment_receipt_url}
                          alt="Comprovante"
                          className="max-w-xs rounded-lg border shadow-sm hover:opacity-90 transition"
                        />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Outros status */}
      {(['approved', 'shipped', 'delivered', 'rejected'] as const).map((status) => {
        const claims = claimsByStatus[status];
        const config = statusConfig[status];
        
        if (claims.length === 0) return null;

        return (
          <Card key={status} className="p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 ${config.color} rounded-full`}></span>
              {config.label} ({claims.length})
            </h2>
            <div className="space-y-2">
              {claims.slice(0, 10).map((claim) => {
                const reward = claim.rewards as { id: string; name: string; coins_required: number; type: string } | null;
                const user = usersMap.get(claim.user_id);
                const profile = profilesMap.get(claim.user_id);
                const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário';
                const avatarUrl = profile?.avatar_url || user?.avatar_url;

                return (
                  <div key={claim.id} className={`p-3 rounded-lg border ${config.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar name={displayName} src={avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{displayName}</p>
                          <p className="text-sm text-gray-600">{reward?.name} • {claim.coins_spent} ❤️</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(claim.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {status !== 'delivered' && status !== 'rejected' && <ClaimActions claim={claim} />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {claims.length > 10 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  +{claims.length - 10} mais...
                </p>
              )}
            </div>
          </Card>
        );
      })}

      {/* Vazio */}
      {(allClaims || []).length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500">Nenhum resgate ainda</p>
        </Card>
      )}
    </div>
  );
}
