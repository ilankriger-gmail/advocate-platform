import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { ChallengeToggleButton } from './ChallengeToggleButton';
import { StatsCardsClient } from './StatsCardsClient';

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

  // Calcular totais
  const totalParticipants = processedChallenges.reduce((acc, c) => acc + c.totalParticipants, 0);
  const totalPending = processedChallenges.reduce((acc, c) => acc + c.pendingCount, 0);
  const totalApproved = processedChallenges.reduce((acc, c) => acc + c.approvedCount, 0);

  // Buscar participacoes pendentes com dados do usuario e desafio
  const { data: pendingParticipations } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      status,
      created_at,
      video_proof_url,
      social_media_url,
      instagram_proof_url,
      result_value,
      ai_confidence,
      challenge_id,
      user_id,
      challenges!inner(id, title, type, icon, coins_reward),
      profiles!inner(display_name, avatar_url, instagram_username)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/25">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Desafios</h1>
            <p className="text-gray-500 text-sm mt-0.5">Crie e gerencie desafios para seus usuarios</p>
          </div>
        </div>
        <Link href="/admin/desafios/novo">
          <Button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg shadow-pink-500/25">
            + Novo Desafio
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Client Component para interatividade */}
      <StatsCardsClient
        totalChallenges={processedChallenges.length}
        activeChallenges={activeChallenges.length}
        totalParticipants={totalParticipants}
        totalPending={totalPending}
        pendingParticipations={(pendingParticipations || []) as any}
      />

      {/* Desafios Ativos */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h2 className="text-xl font-bold text-gray-900">
            Desafios Ativos
          </h2>
          <Badge className="bg-green-100 text-green-700">{activeChallenges.length}</Badge>
        </div>

        {activeChallenges.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeChallenges.map((challenge) => (
              <ChallengeAdminCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-gray-50">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-gray-500">Nenhum desafio ativo no momento</p>
            <Link href="/admin/desafios/novo" className="inline-block mt-3">
              <Button size="sm" variant="outline">Criar primeiro desafio</Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Desafios Ocultos */}
      {inactiveChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">
              Desafios Ocultos
            </h2>
            <Badge className="bg-gray-100 text-gray-600">{inactiveChallenges.length}</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inactiveChallenges.map((challenge) => (
              <ChallengeAdminCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </section>
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
    thumbnail_url?: string | null;
    totalParticipants: number;
    pendingCount: number;
    approvedCount: number;
    winnersCount: number;
  };
  showReactivate?: boolean;
}

function ChallengeAdminCard({ challenge }: ChallengeCardProps) {
  const getTypeBadge = () => {
    const typeStyles: Record<string, string> = {
      fisico: 'bg-blue-500/20 text-blue-100',
      engajamento: 'bg-purple-500/20 text-purple-100',
      participe: 'bg-green-500/20 text-green-100',
    };
    const style = typeStyles[challenge.type] || 'bg-white/20 text-white';
    const label = challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1);
    return <Badge className={`${style} border-0`}>{label}</Badge>;
  };

  // Header gradient muda baseado no tipo e estado
  const getHeaderGradient = () => {
    if (!challenge.is_active) return 'bg-gradient-to-r from-gray-400 to-gray-500';
    switch (challenge.type) {
      case 'fisico':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'engajamento':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'participe':
        return 'bg-gradient-to-r from-pink-500 to-red-500';
      default:
        return 'bg-gradient-to-r from-pink-500 to-red-500';
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-xl transition-all duration-300 h-full ${!challenge.is_active ? 'opacity-70 grayscale-[30%]' : ''}`}>
      <Link href={`/admin/desafios/${challenge.id}`} className="block">
        {/* Header com thumbnail ou gradiente */}
        <div className={`${!challenge.thumbnail_url ? getHeaderGradient() : ''} p-5 text-white relative overflow-hidden min-h-[120px]`}>
          {/* Thumbnail de fundo quando disponível */}
          {challenge.thumbnail_url && (
            <>
              <img
                src={challenge.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Overlay escuro para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
            </>
          )}
          {/* Pattern de fundo (apenas quando não há thumbnail) */}
          {!challenge.thumbnail_url && (
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white rounded-full" />
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white rounded-full" />
            </div>
          )}

          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <span className="text-3xl">{challenge.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold truncate">{challenge.title}</h3>
                {getTypeBadge()}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/90 text-sm font-medium">
                  +{challenge.coins_reward} corações
                </span>
                {challenge.prize_amount && (
                  <span className="text-white/70 text-sm">
                    | R$ {challenge.prize_amount.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line leading-relaxed">
            {challenge.description || 'Sem descricao'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{challenge.totalParticipants}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Participantes</p>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <p className="text-lg font-bold text-yellow-600">{challenge.pendingCount}</p>
              <p className="text-[10px] text-yellow-600 uppercase tracking-wide">Pendentes</p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{challenge.approvedCount}</p>
              <p className="text-[10px] text-green-600 uppercase tracking-wide">Aprovados</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Actions */}
      <div className="px-5 pb-5 pt-0 flex items-center gap-2">
        <Link href={`/admin/desafios/${challenge.id}`} className="flex-1">
          <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-800">
            Gerenciar
          </Button>
        </Link>
        <Link href={`/admin/desafios/${challenge.id}/editar`}>
          <Button size="sm" variant="outline">Editar</Button>
        </Link>
        <Link href={`/lp/desafio/${challenge.id}`} target="_blank">
          <Button size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Button>
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
