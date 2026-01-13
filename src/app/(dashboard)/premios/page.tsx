import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/config/site';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Badge } from '@/components/ui';
import { RewardClaimButton } from './RewardClaimButton';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings([
    'seo_premios_title',
    'seo_premios_description',
  ]);

  return {
    title: settings.seo_premios_title,
    description: settings.seo_premios_description,
    openGraph: {
      title: settings.seo_premios_title,
      description: settings.seo_premios_description,
    },
  };
}

export default async function PremiosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar saldo de moedas
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  // Buscar prêmios disponíveis
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('coins_required', { ascending: true });

  // Buscar resgates do usuário
  const { data: claims } = await supabase
    .from('reward_claims')
    .select('*, rewards(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const balance = userCoins?.balance || 0;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    shipped: 'Enviado',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Prêmios" />

      {/* Saldo de Moedas */}
      <Card className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Seus corações</p>
            <p className="text-4xl font-bold">{balance} ❤️</p>
          </div>
          <div className="text-6xl">❤️</div>
        </div>
      </Card>

      {/* Prêmios Disponíveis */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prêmios Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards && rewards.length > 0 ? (
            rewards.map((reward) => {
              const progress = Math.min((balance / reward.coins_required) * 100, 100);
              const canClaim = balance >= reward.coins_required;
              const isPhysical = reward.type === 'physical';
              const hasStock = reward.quantity_available === null || reward.quantity_available > 0;

              return (
                <Card key={reward.id} className="overflow-hidden">
                  {/* Imagem do prêmio */}
                  <div className="aspect-video bg-gray-100 relative">
                    {reward.image_url ? (
                      <img
                        src={reward.image_url}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-purple-100 to-pink-100">
                        🎁
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {isPhysical && (
                        <span className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium">
                          📦 Físico
                        </span>
                      )}
                      {!isPhysical && (
                        <span className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium">
                          💻 Digital
                        </span>
                      )}
                    </div>
                    {/* Badge de série limitada para físicos */}
                    {isPhysical && (
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-black/70 text-white rounded text-xs">
                          Série Limitada
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reward.description}</p>

                    {/* Informação sobre entrega para físicos */}
                    {isPhysical && (
                      <p className="text-xs text-amber-600 mt-2">
                        * Você precisará informar seu endereço para receber em casa
                      </p>
                    )}

                    {/* Barra de Progresso */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Seu progresso</span>
                        <span className="font-medium text-gray-900">
                          {balance} / {reward.coins_required} ❤️
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            canClaim
                              ? 'bg-green-500'
                              : 'bg-gradient-to-r from-pink-500 to-red-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      {!canClaim && (
                        <p className="text-xs text-gray-500 mt-1">
                          Faltam {reward.coins_required - balance} corações
                        </p>
                      )}
                      {canClaim && hasStock && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          Você pode resgatar este prêmio!
                        </p>
                      )}
                    </div>

                    {/* Botão de Resgatar */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-indigo-600 font-bold text-lg">
                        {reward.coins_required} ❤️
                      </span>
                      <RewardClaimButton
                        reward={{
                          id: reward.id,
                          name: reward.name,
                          type: reward.type || 'digital',
                          coins_required: reward.coins_required,
                        }}
                        canClaim={canClaim && hasStock}
                      />
                    </div>

                    {/* Estoque baixo */}
                    {reward.quantity_available !== null && reward.quantity_available <= 10 && reward.quantity_available > 0 && (
                      <p className="text-xs text-orange-500 mt-2">
                        🔥 Apenas {reward.quantity_available} disponíveis!
                      </p>
                    )}
                    {reward.quantity_available !== null && reward.quantity_available <= 0 && (
                      <p className="text-xs text-red-500 mt-2 font-medium">
                        Esgotado
                      </p>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8 text-center col-span-full">
              <p className="text-gray-500">Nenhum prêmio disponível no momento.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Histórico de Resgates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Meus Resgates</h2>
        <Card className="divide-y divide-gray-100">
          {claims && claims.length > 0 ? (
            claims.map((claim) => (
              <div key={claim.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {(claim.rewards as { name: string })?.name || 'Prêmio'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(claim.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[claim.status]}`}>
                    {statusLabels[claim.status]}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">-{claim.coins_spent} ❤️</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              Você ainda não resgatou nenhum prêmio.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
