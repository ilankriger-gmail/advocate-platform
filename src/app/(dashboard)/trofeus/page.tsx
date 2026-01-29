import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, Avatar } from '@/components/ui';
import { TrophyMessageForm } from './TrophyMessageForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sala de Troféus | Arena Te Amo',
  description: 'Conheça os campeões que venceram os desafios da Arena Te Amo!',
};

export default async function TrophyRoomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Buscar todas as participações aprovadas com dados do desafio e usuário
  const { data: winners } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      user_id,
      challenge_id,
      status,
      result_value,
      coins_earned,
      video_proof_url,
      winner_message,
      created_at,
      challenges:challenge_id (
        id, title, icon, type, goal_type, goal_value
      ),
      profiles:user_id (
        id, full_name, avatar_url
      )
    `)
    .eq('status', 'approved')
    .order('coins_earned', { ascending: false });

  // Fallback: tentar buscar nome de users se profiles não tiver
  const userIds = [...new Set((winners || []).map(w => w.user_id))];
  const { data: usersData } = await supabase
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', userIds);
  const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

  // Agrupar por tipo de desafio
  const physicalWinners = (winners || []).filter(w => {
    const ch = w.challenges as any;
    return ch?.type === 'fisico';
  });
  const atosAmorWinners = (winners || []).filter(w => {
    const ch = w.challenges as any;
    return ch?.type === 'atos_amor';
  });
  const otherWinners = (winners || []).filter(w => {
    const ch = w.challenges as any;
    return ch?.type !== 'fisico' && ch?.type !== 'atos_amor';
  });

  // Verificar quais troféus pertencem ao usuário logado (para mostrar form de mensagem)
  const myWinnerIds = (winners || []).filter(w => w.user_id === user.id).map(w => w.id);

  const getGoalLabel = (goalType: string | null) => goalType === 'time' ? 's' : 'x';

  const renderWinnerCard = (winner: any, index: number) => {
    const challenge = winner.challenges as any;
    const profile = winner.profiles as any;
    const userFallback = usersMap.get(winner.user_id);
    const displayName = profile?.full_name || userFallback?.full_name || 'Membro';
    const avatarUrl = profile?.avatar_url || userFallback?.avatar_url;
    const isMe = winner.user_id === user.id;

    const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';

    return (
      <Card key={winner.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${
        isMe ? 'ring-2 ring-pink-400 shadow-pink-100' : ''
      }`}>
        {/* Rank badge */}
        {index < 3 && (
          <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-yellow-500 text-white px-3 py-1 rounded-bl-xl text-lg font-black z-10">
            {rankIcon}
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* User info */}
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow">
                {displayName[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{displayName}</p>
              <p className="text-sm text-gray-500 truncate">
                {challenge?.icon} {challenge?.title}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-bold">
              ❤️ {winner.coins_earned}
            </span>
            {winner.result_value && challenge?.goal_type && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                🎯 {winner.result_value}{getGoalLabel(challenge.goal_type)}
              </span>
            )}
          </div>

          {/* Winner message */}
          {winner.winner_message && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <p className="text-sm text-gray-700 italic">&ldquo;{winner.winner_message}&rdquo;</p>
            </div>
          )}

          {/* Form para adicionar mensagem (só para o próprio usuário, se não tem mensagem) */}
          {isMe && !winner.winner_message && (
            <TrophyMessageForm participationId={winner.id} />
          )}

          {/* Video link */}
          {winner.video_proof_url && (
            <a
              href={winner.video_proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              ▶️ Assistir vídeo
            </a>
          )}
        </div>
      </Card>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, winners: any[], gradient: string) => {
    if (winners.length === 0) return null;
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${gradient} rounded-xl flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{winners.length} campeão(ões)</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {winners.map((w, i) => renderWinnerCard(w, i))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="🏆 Sala de Troféus"
        description="Os campeões que venceram os desafios"
      />

      {/* Banner épico */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMykiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')]" />
        </div>
        <div className="relative p-6 flex items-center gap-4">
          <div className="text-6xl">🏆</div>
          <div>
            <h2 className="text-2xl font-black">Hall da Fama</h2>
            <p className="text-amber-100">
              {(winners || []).length} conquistas • {userIds.length} campeões
            </p>
          </div>
        </div>
      </Card>

      {/* Desafios Físicos */}
      {renderSection(
        'Desafios Físicos',
        <Medal className="w-6 h-6 text-white" />,
        physicalWinners,
        'bg-gradient-to-br from-blue-500 to-cyan-500'
      )}

      {/* Atos de Amor */}
      {renderSection(
        'Atos de Amor',
        <Star className="w-6 h-6 text-white fill-white" />,
        atosAmorWinners,
        'bg-gradient-to-br from-rose-500 to-pink-500'
      )}

      {/* Outros */}
      {renderSection(
        'Outros Desafios',
        <Crown className="w-6 h-6 text-white" />,
        otherWinners,
        'bg-gradient-to-br from-purple-500 to-indigo-500'
      )}

      {/* Vazio */}
      {(!winners || winners.length === 0) && (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum campeão ainda</h2>
          <p className="text-gray-500">Complete desafios para aparecer aqui!</p>
        </Card>
      )}
    </div>
  );
}
