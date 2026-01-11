import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { ChallengeToggleButton } from './ChallengeToggleButton';

export default async function AdminDesafiosPage() {
  const supabase = await createClient();

  // Buscar desafios com contagem de participações
  const { data: challenges } = await supabase
    .from('challenges')
    .select(`
      *,
      challenge_participants (
        id,
        status
      ),
      challenge_winners (
        id
      )
    `)
    .order('created_at', { ascending: false });

  // Processar dados
  const processedChallenges = (challenges || []).map((c) => {
    const participants = c.challenge_participants || [];
    return {
      ...c,
      totalParticipants: participants.length,
      pendingCount: participants.filter((p: { status: string }) => p.status === 'pending').length,
      approvedCount: participants.filter((p: { status: string }) => p.status === 'approved').length,
      winnersCount: (c.challenge_winners || []).length,
    };
  });

  const activeChallenges = processedChallenges.filter((c) => c.is_active);
  const inactiveChallenges = processedChallenges.filter((c) => !c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Desafios</h1>
          <p className="text-gray-500 text-sm mt-1">Crie e gerencie desafios para seus usuários</p>
        </div>
        <Link href="/admin/desafios/novo">
          <Button>+ Novo Desafio</Button>
        </Link>
      </div>

      {/* Desafios Ativos */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Desafios Ativos ({activeChallenges.length})
        </h2>

        {activeChallenges.length > 0 ? (
          <div className="space-y-4">
            {activeChallenges.map((challenge) => (
              <ChallengeAdminCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum desafio ativo no momento</p>
          </Card>
        )}
      </div>

      {/* Desafios Ocultos */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          Desafios Ocultos ({inactiveChallenges.length})
        </h2>

        {inactiveChallenges.length > 0 ? (
          <div className="space-y-4">
            {inactiveChallenges.map((challenge) => (
              <ChallengeAdminCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center bg-gray-50">
            <p className="text-gray-400 text-sm">Nenhum desafio oculto</p>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    icon: string;
    is_active: boolean;
    coins_reward: number;
    prize_amount?: number | null;
    totalParticipants: number;
    pendingCount: number;
    approvedCount: number;
    winnersCount: number;
  };
  showReactivate?: boolean;
}

function ChallengeAdminCard({ challenge }: ChallengeCardProps) {
  const getTypeBadge = () => {
    switch (challenge.type) {
      case 'fisico':
        return <Badge className="bg-white/20 text-white border-0">Fisico</Badge>;
      case 'engajamento':
        return <Badge className="bg-white/20 text-white border-0">Engajamento</Badge>;
      case 'participe':
        return <Badge className="bg-white/20 text-white border-0">Participe</Badge>;
      default:
        return <Badge className="bg-white/20 text-white border-0">{challenge.type}</Badge>;
    }
  };

  // Header gradient muda baseado no estado
  const headerGradient = challenge.is_active
    ? 'bg-gradient-to-r from-pink-500 to-red-500'
    : 'bg-gradient-to-r from-gray-400 to-gray-500';

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow h-full ${!challenge.is_active ? 'opacity-75' : ''}`}>
      <Link href={`/admin/desafios/${challenge.id}`} className="block">
        {/* Header com gradiente */}
        <div className={`${headerGradient} p-4 text-white`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{challenge.icon}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold">{challenge.title}</h3>
                {getTypeBadge()}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={challenge.is_active ? 'text-pink-100 text-sm' : 'text-gray-200 text-sm'}>
                  +{challenge.coins_reward} coracoes
                </span>
                {challenge.prize_amount && (
                  <span className="text-white/80 text-sm">
                    R$ {challenge.prize_amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {challenge.description || 'Sem descrição'}
          </p>

          {/* Stats como pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {challenge.totalParticipants} participantes
            </span>
            {challenge.pendingCount > 0 && (
              <span className="px-2 py-1 bg-yellow-100 rounded-full text-yellow-700">
                {challenge.pendingCount} pendentes
              </span>
            )}
            {challenge.type !== 'fisico' && (
              <span className="px-2 py-1 bg-green-100 rounded-full text-green-700">
                {challenge.winnersCount} ganhadores
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-4 pb-4 pt-2 border-t flex items-center gap-2">
        <Link href={`/admin/desafios/${challenge.id}`} className="flex-1">
          <Button size="sm" className="w-full">Gerenciar</Button>
        </Link>
        <ChallengeToggleButton
          challengeId={challenge.id}
          challengeName={challenge.title}
          isActive={challenge.is_active}
        />
      </div>
    </Card>
  );
}
