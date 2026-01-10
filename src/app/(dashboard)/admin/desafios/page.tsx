import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { ChallengeDeleteButton } from './ChallengeDeleteButton';

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Desafios Inativos */}
      {inactiveChallenges.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Desafios Inativos ({inactiveChallenges.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveChallenges.map((challenge) => (
              <ChallengeAdminCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
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
}

function ChallengeAdminCard({ challenge }: ChallengeCardProps) {
  const getTypeBadge = () => {
    switch (challenge.type) {
      case 'fisico':
        return <Badge className="bg-blue-100 text-blue-700">Fisico</Badge>;
      case 'engajamento':
        return <Badge className="bg-purple-100 text-purple-700">Engajamento</Badge>;
      case 'participe':
        return <Badge className="bg-pink-100 text-pink-700">Participe</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{challenge.type}</Badge>;
    }
  };

  // Só pode excluir se não tiver participantes nem ganhadores
  const canDelete = challenge.totalParticipants === 0 && challenge.winnersCount === 0;

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow h-full">
      <Link href={`/admin/desafios/${challenge.id}`} className="block">
        <div className="flex items-start gap-4">
          <span className="text-3xl">{challenge.icon}</span>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-gray-900">{challenge.title}</h3>
              {getTypeBadge()}
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {challenge.description || 'Sem descrição'}
            </p>

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

            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-pink-500 font-bold text-sm">
                +{challenge.coins_reward} coracoes
              </span>
              {challenge.prize_amount && (
                <span className="text-green-600 font-bold text-sm">
                  R$ {challenge.prize_amount.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Botão de excluir (fora do Link) */}
      <div className="mt-3 pt-3 border-t">
        <ChallengeDeleteButton
          challengeId={challenge.id}
          challengeName={challenge.title}
          canDelete={canDelete}
          participantsCount={challenge.totalParticipants}
          winnersCount={challenge.winnersCount}
        />
      </div>
    </Card>
  );
}
