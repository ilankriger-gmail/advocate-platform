import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Badge } from '@/components/ui';

export default async function PrêmiosPage() {
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
      <PageHeader title="Meus Prêmios" />

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

      {/* Prêmios Disponiveis */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prêmios Disponiveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards && rewards.length > 0 ? (
            rewards.map((reward) => (
              <Card key={reward.id} className="p-4">
                <div className="aspect-vídeo bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                  🎁
                </div>
                <h3 className="font-semibold text-gray-900">{reward.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{reward.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-indigo-600 font-bold">{reward.coins_required} ❤️</span>
                  <button
                    disabled={balance < reward.coins_required}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      balance >= reward.coins_required
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Resgatar
                  </button>
                </div>
                {reward.quantity_available !== null && reward.quantity_available <= 10 && (
                  <p className="text-xs text-orange-500 mt-2">
                    Apenas {reward.quantity_available} disponíveis!
                  </p>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center col-span-full">
              <p className="text-gray-500">Nenhum prêmio disponível no momento.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Historico de Resgates */}
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
