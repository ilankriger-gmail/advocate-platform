import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { ClaimActions } from '../premios/RewardAdminComponents';

export const dynamic = 'force-dynamic';

export default async function AdminResgatesPage() {
  const supabase = await createClient();

  // Buscar todos os resgates
  const { data: allClaims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        coins_required,
        type
      )
    `)
    .order('created_at', { ascending: false });

  // Buscar nomes dos usuários
  const userIds = [...new Set(allClaims?.map(c => c.user_id) || [])];
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .in('id', userIds);

  const usersMap = new Map(users?.map(u => [u.id, u]) || []);

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
              const reward = claim.rewards as { id: string; name: string; coins_required: number; type: string } | null;
              const user = usersMap.get(claim.user_id);

              return (
                <div key={claim.id} className="p-4 bg-white rounded-lg border border-yellow-200 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-bold text-gray-900 text-lg">{user?.full_name || user?.email || 'Usuário'}</p>
                        <Badge className="bg-yellow-500 text-white">Pendente</Badge>
                        {reward?.type === 'money' && <Badge className="bg-green-600 text-white">💵 PIX</Badge>}
                      </div>
                      <p className="text-gray-600">
                        Resgatou: <strong>{reward?.name}</strong> ({claim.coins_spent} ❤️)
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(claim.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Dados de entrega/PIX */}
                      {claim.delivery_address && (
                        <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                          {claim.delivery_address.pix_key && (
                            <div className="space-y-1">
                              <p className="font-semibold text-green-700">🔑 Dados PIX:</p>
                              <p><strong>Chave:</strong> <code className="bg-white px-2 py-1 rounded">{claim.delivery_address.pix_key}</code></p>
                              <p><strong>Tipo:</strong> {claim.delivery_address.pix_key_type?.toUpperCase()}</p>
                              <p><strong>Nome:</strong> {claim.delivery_address.recipient_name}</p>
                            </div>
                          )}
                          {claim.delivery_address.street && (
                            <div className="space-y-1">
                              <p className="font-semibold text-purple-700">📦 Endereço:</p>
                              <p>{claim.delivery_address.street}, {claim.delivery_address.number}</p>
                              <p>{claim.delivery_address.neighborhood} - {claim.delivery_address.city}/{claim.delivery_address.state}</p>
                              <p>CEP: {claim.delivery_address.zip_code}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <ClaimActions claim={claim} />
                  </div>
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

                return (
                  <div key={claim.id} className={`p-3 rounded-lg border ${config.bgColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{user?.full_name || user?.email || 'Usuário'}</p>
                        <p className="text-sm text-gray-600">{reward?.name} • {claim.coins_spent} ❤️</p>
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
