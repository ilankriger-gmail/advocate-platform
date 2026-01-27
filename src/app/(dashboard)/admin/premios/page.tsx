import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { RewardActions, ClaimActions, NewRewardForm } from './RewardAdminComponents';
import { ShopImportButton } from './ShopImportModal';


export const dynamic = 'force-dynamic';
export default async function AdminPrêmiosPage() {
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
        coins_required
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
          <p className="text-gray-500 text-sm mt-1">Gerencie prêmios e resgates dos usuários</p>
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
                const reward = claim.rewards as { id: string; name: string; coins_required: number } | null;
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
                          <p className="font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
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

                        {/* Dados de entrega/PIX */}
                        {claim.delivery_address && (
                          <div className="mt-2 p-2 bg-white rounded text-sm text-gray-700 space-y-1">
                            {claim.delivery_address.pix_key && (
                              <>
                                <p><strong>🔑 PIX:</strong> {claim.delivery_address.pix_key}</p>
                                <p><strong>Tipo:</strong> {claim.delivery_address.pix_key_type?.toUpperCase()}</p>
                                <p><strong>Nome:</strong> {claim.delivery_address.recipient_name}</p>
                              </>
                            )}
                            {claim.delivery_address.street && (
                              <>
                                <p><strong>📦 Endereço:</strong></p>
                                <p>{claim.delivery_address.street}, {claim.delivery_address.number}</p>
                                <p>{claim.delivery_address.neighborhood} - {claim.delivery_address.city}/{claim.delivery_address.state}</p>
                                <p>CEP: {claim.delivery_address.zip_code}</p>
                              </>
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
          </div>
        </Card>
      )}

      {/* Importar da Loja */}
      <ShopImportButton />

      {/* Criar Nova Recompensa */}
      <NewRewardForm />

      {/* Recompensas Ativas */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Recompensas Ativas ({activeRewards.length})
        </h2>

        {activeRewards.length > 0 ? (
          <div className="space-y-4">
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

      {/* Recompensas Ocultas */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          Recompensas Ocultas ({inactiveRewards.length})
        </h2>

        {inactiveRewards.length > 0 ? (
          <div className="space-y-4">
            {inactiveRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-gray-50">
            <p className="text-gray-400 text-sm">Nenhuma recompensa oculta</p>
          </Card>
        )}
      </div>
    </div>
  );
}

interface RewardCardProps {
  reward: {
    id: string;
    name: string;
    description: string | null;
    coins_required: number;
    quantity_available: number | null;
    image_url: string | null;
    is_active: boolean;
    type: string;
  };
}

function RewardCard({ reward }: RewardCardProps) {
  // Header gradient muda baseado no tipo e estado
  const getHeaderGradient = () => {
    if (!reward.is_active) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    if (reward.type === 'money') return 'bg-gradient-to-r from-green-500 to-emerald-600';
    return 'bg-gradient-to-r from-indigo-500 to-purple-600';
  };
  const headerGradient = getHeaderGradient();

  const getTypeBadge = () => {
    if (reward.type === 'money') return { label: 'PIX', className: 'bg-green-400/30 text-white border-0' };
    if (reward.type === 'physical') return { label: 'Físico', className: 'bg-white/20 text-white border-0' };
    return { label: 'Digital', className: 'bg-white/20 text-white border-0' };
  };
  const typeBadge = getTypeBadge();

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${!reward.is_active ? 'opacity-75' : ''}`}>
      {/* Imagem se existir */}
      {reward.image_url && (
        <img
          src={reward.image_url}
          alt={reward.name}
          className={`w-full h-32 object-cover ${!reward.is_active ? 'grayscale' : ''}`}
        />
      )}

      {/* Header com gradiente */}
      <div className={`${headerGradient} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{reward.name}</h3>
            <p className={reward.is_active ? 'text-indigo-100 text-sm' : 'text-gray-200 text-sm'}>
              {reward.coins_required} corações
            </p>
          </div>
          <Badge className={typeBadge.className}>
            {typeBadge.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {reward.description || 'Sem descrição'}
        </p>

        {/* Stock */}
        {reward.quantity_available !== null && (
          <p className={`text-sm font-medium ${reward.quantity_available > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {reward.quantity_available > 0 ? `${reward.quantity_available} em estoque` : 'Esgotado'}
          </p>
        )}

        {/* Actions */}
        <div className="pt-2 border-t">
          <RewardActions reward={reward} />
        </div>
      </div>
    </Card>
  );
}
