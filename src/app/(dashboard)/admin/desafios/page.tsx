import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Button, Badge } from '@/components/ui';
import { ChallengeToggleButton } from './ChallengeToggleButton';
import { StatsCardsClient } from './StatsCardsClient';
import { ChallengesViewToggle } from './ChallengesViewToggle';

export default async function AdminDesafiosPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const viewMode = params.view || 'cards';
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
      challenges (id, title, type, icon, coins_reward),
      profiles:user_id (
        id,
        full_name,
        avatar_url,
        instagram_handle
      )
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
        <div className="flex items-center gap-3">
          <ChallengesViewToggle />
          <Link href="/admin/desafios/novo">
            <Button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 shadow-lg shadow-pink-500/25">
              + Novo Desafio
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards - Client Component para interatividade */}
      <StatsCardsClient
        totalChallenges={processedChallenges.length}
        activeChallenges={activeChallenges.length}
        totalParticipants={totalParticipants}
        totalPending={totalPending}
        pendingParticipations={(pendingParticipations || []) as any}
      />

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <>
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
        </>
      )}

      {/* Visualização em Lista por Tipo */}
      {viewMode === 'list' && (
        <ChallengesListView challenges={processedChallenges} />
      )}
    </div>
  );
}

// Componente de visualização em lista agrupada por tipo
function ChallengesListView({ challenges }: { challenges: any[] }) {
  const typeConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    fisico: { label: 'Físico', icon: '💪', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
    atos_amor: { label: 'Atos de Amor', icon: '💝', color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200' },
    engajamento: { label: 'Engajamento', icon: '💬', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
    participe: { label: 'Participe', icon: '🎁', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  };

  // Agrupar desafios por tipo
  const groupedChallenges = challenges.reduce((acc, challenge) => {
    const type = challenge.type || 'outros';
    if (!acc[type]) acc[type] = [];
    acc[type].push(challenge);
    return acc;
  }, {} as Record<string, any[]>);

  // Ordenar tipos
  const orderedTypes = ['fisico', 'atos_amor', 'engajamento', 'participe'];
  const sortedTypes = orderedTypes.filter(t => groupedChallenges[t]?.length > 0);

  if (challenges.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🎯</span>
        </div>
        <p className="text-gray-500">Nenhum desafio cadastrado</p>
        <Link href="/admin/desafios/novo" className="inline-block mt-3">
          <Button size="sm" variant="outline">Criar primeiro desafio</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedTypes.map((type) => {
        const config = typeConfig[type] || { label: type, icon: '🎯', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
        const typeChallenges = groupedChallenges[type] || [];

        return (
          <section key={type} className="space-y-3">
            {/* Header do tipo */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${config.bgColor}`}>
              <span className="text-2xl">{config.icon}</span>
              <h2 className={`text-lg font-bold ${config.color}`}>
                {config.label}
              </h2>
              <Badge className={config.bgColor + ' ' + config.color + ' border'}>
                {typeChallenges.length}
              </Badge>
            </div>

            {/* Lista de desafios */}
            <div className="space-y-2">
              {typeChallenges.map((challenge: any) => (
                <ChallengeListItem key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Item de desafio na lista
function ChallengeListItem({ challenge }: { challenge: any }) {
  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all ${!challenge.is_active ? 'opacity-60' : ''}`}>
      {/* Ícone */}
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-xl">{challenge.icon}</span>
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{challenge.title}</h3>
          {!challenge.is_active && (
            <Badge className="bg-gray-100 text-gray-500 text-xs">Oculto</Badge>
          )}
          {challenge.ends_at === null && challenge.is_active && (
            <Badge className="bg-amber-100 text-amber-700 text-xs">Sem prazo</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
          <span>❤️ +{challenge.coins_reward}</span>
          {challenge.starts_at && (
            <span>📅 {formatDate(challenge.starts_at)}{challenge.ends_at ? ` - ${formatDate(challenge.ends_at)}` : ''}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-bold text-gray-900">{challenge.totalParticipants}</p>
          <p className="text-xs text-gray-500">Partic.</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-yellow-600">{challenge.pendingCount}</p>
          <p className="text-xs text-gray-500">Pend.</p>
        </div>
        <div className="text-center">
          <p className="font-bold text-green-600">{challenge.approvedCount}</p>
          <p className="text-xs text-gray-500">Aprov.</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        <Link href={`/admin/desafios/${challenge.id}`}>
          <Button size="sm" className="bg-gray-900 hover:bg-gray-800">
            Gerenciar
          </Button>
        </Link>
        <Link href={`/admin/desafios/${challenge.id}/editar`}>
          <Button size="sm" variant="outline">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        </Link>
        <ChallengeToggleButton
          challengeId={challenge.id}
          challengeName={challenge.title}
          isActive={challenge.is_active}
        />
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
            {challenge.description || 'Sem descrição'}
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
