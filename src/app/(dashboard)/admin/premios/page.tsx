import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { RewardActions, ClaimActions, NewRewardForm } from './RewardAdminComponents';

export default async function AdminPremiosPage() {
  const supabase = await createClient();

  // Buscar recompensas
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false });

  // Buscar resgates pendentes
  const { data: pendingClaims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        coins_cost
      ),
      profiles:user_id (
        id,
        full_name,
        email
      )
    `)
    .in('status', ['pending', 'approved', 'shipped'])
    .order('created_at', { ascending: false });

  const activeRewards = (rewards || []).filter((r) => r.is_active);
  const inactiveRewards = (rewards || []).filter((r) => !r.is_active);

  const claimsByStatus = {
    pending: (pendingClaims || []).filter((c) => c.status === 'pending'),
    approved: (pendingClaims || []).filter((c) => c.status === 'approved'),
    shipped: (pendingClaims || []).filter((c) => c.status === 'shipped'),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Recompensas</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie premios e resgates dos usuarios</p>
        </div>
      </div>

      {/* Resgates Pendentes */}
      {(pendingClaims && pendingClaims.length > 0) && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Resgates a Processar ({pendingClaims.length})
          </h2>

          <div className="space-y-4">
            {/* Tabs de status */}
            <div className="flex gap-2 border-b pb-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                Pendentes: {claimsByStatus.pending.length}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                Aprovados: {claimsByStatus.approved.length}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                Enviados: {claimsByStatus.shipped.length}
              </span>
            </div>

            {/* Lista de resgates */}
            <div className="space-y-3">
              {pendingClaims.map((claim) => {
                const reward = claim.rewards as { id: string; name: string; coins_cost: number } | null;
                const profile = claim.profiles as { id: string; full_name: string; email: string } | null;

                return (
                  <div
                    key={claim.id}
                    className={`p-4 rounded-lg border ${
                      claim.status === 'pending'
                        ? 'bg-yellow-50 border-yellow-200'
                        : claim.status === 'approved'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-purple-50 border-purple-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900">{profile?.full_name || 'Usuario'}</p>
                          <Badge
                            className={
                              claim.status === 'pending'
                                ? 'bg-yellow-500 text-white'
                                : claim.status === 'approved'
                                ? 'bg-blue-500 text-white'
                                : 'bg-purple-500 text-white'
                            }
                          >
                            {claim.status === 'pending'
                              ? 'Pendente'
                              : claim.status === 'approved'
                              ? 'Aprovado'
                              : 'Enviado'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Resgatou: <strong>{reward?.name}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(claim.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>

                        {/* Dados de entrega */}
                        {claim.delivery_info && (
                          <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                            <strong>Entrega:</strong> {JSON.stringify(claim.delivery_info)}
                          </div>
                        )}
                      </div>

                      <ClaimActions claim={claim} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Criar Nova Recompensa */}
      <NewRewardForm />

      {/* Recompensas Ativas */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Recompensas Ativas ({activeRewards.length})
        </h2>

        {activeRewards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhuma recompensa ativa</p>
          </Card>
        )}
      </div>

      {/* Recompensas Inativas */}
      {inactiveRewards.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Recompensas Inativas ({inactiveRewards.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface RewardCardProps {
  reward: {
    id: string;
    name: string;
    description: string | null;
    coins_cost: number;
    stock: number | null;
    image_url: string | null;
    is_active: boolean;
    type: string;
  };
}

function RewardCard({ reward }: RewardCardProps) {
  return (
    <Card className="overflow-hidden">
      {reward.image_url && (
        <img
          src={reward.image_url}
          alt={reward.name}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900">{reward.name}</h3>
          <Badge className={reward.type === 'physical' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}>
            {reward.type === 'physical' ? 'Fisico' : 'Digital'}
          </Badge>
        </div>

        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
          {reward.description || 'Sem descricao'}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-pink-500 font-bold">{reward.coins_cost} coracoes</span>
          {reward.stock !== null && (
            <span className={`text-sm ${reward.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reward.stock > 0 ? `${reward.stock} em estoque` : 'Esgotado'}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t">
          <RewardActions reward={reward} />
        </div>
      </div>
    </Card>
  );
}
