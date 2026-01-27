import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, Badge, Avatar } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserHistoryPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Buscar dados do usuário
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  // Buscar saldo atual
  const { data: coins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', id)
    .single();

  // Buscar histórico de transações
  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Buscar participações em desafios
  const { data: participations } = await supabase
    .from('challenge_participants')
    .select(`
      *,
      challenges:challenge_id (
        id,
        title,
        coins_reward
      )
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // Buscar resgates
  const { data: claims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        coins_required
      )
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url || user?.avatar_url;

  // Calcular totais
  const totalEarned = (transactions || [])
    .filter(t => t.type === 'earned' && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalSpent = (transactions || [])
    .filter(t => t.type === 'spent' || t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const approvedParticipations = (participations || []).filter(p => p.status === 'approved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/resgates" className="text-purple-600 hover:text-purple-800 text-sm">
          ← Voltar para Resgates
        </Link>
      </div>

      {/* User Info */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Avatar name={displayName} src={avatarUrl} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-3xl font-bold text-pink-600">❤️ {coins?.balance || 0}</p>
            <p className="text-sm text-gray-500">Saldo Atual</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">+{totalEarned}</p>
            <p className="text-sm text-gray-500">Total Ganho</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">-{totalSpent}</p>
            <p className="text-sm text-gray-500">Total Gasto</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{approvedParticipations.length}</p>
            <p className="text-sm text-gray-500">Desafios Completos</p>
          </div>
        </div>
      </Card>

      {/* Desafios Completados */}
      {approvedParticipations.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Desafios Completados</h2>
          <div className="space-y-2">
            {approvedParticipations.map((p) => {
              const challenge = p.challenges as { id: string; title: string; coins_reward: number } | null;
              return (
                <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-medium text-gray-900">{challenge?.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        {p.result && ` • Resultado: ${p.result}`}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white">+{challenge?.coins_reward || 0} ❤️</Badge>
                  {p.proof_url && (
                    <a href={p.proof_url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-sm ml-2">
                      📹 Ver Prova
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Resgates */}
      {(claims || []).length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🎁 Resgates</h2>
          <div className="space-y-2">
            {claims?.map((c) => {
              const reward = c.rewards as { id: string; name: string; coins_required: number } | null;
              const statusColors: Record<string, string> = {
                pending: 'bg-yellow-500',
                approved: 'bg-blue-500',
                shipped: 'bg-purple-500',
                delivered: 'bg-green-500',
                rejected: 'bg-red-500',
              };
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{reward?.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">-{c.coins_spent} ❤️</span>
                    <Badge className={`${statusColors[c.status]} text-white`}>{c.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Histórico Completo de Transações */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📜 Histórico de Corações</h2>
        {(transactions || []).length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhuma transação ainda</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions?.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.description || 'Transação'}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount} ❤️
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
