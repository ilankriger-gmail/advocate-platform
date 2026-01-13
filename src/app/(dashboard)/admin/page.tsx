import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  href: string;
  color: string;
  description?: string;
}

function StatCard({ title, value, icon, href, color, description }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className={`p-4 sm:p-5 hover:shadow-lg transition-shadow cursor-pointer border-l-4 ${color}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <span className="text-2xl sm:text-3xl">{icon}</span>
        </div>
      </Card>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Buscar estatisticas em paralelo
  const [
    { count: pendingPosts },
    { count: activeChallenges },
    { count: pendingParticipations },
    { count: activeEvents },
    { count: upcomingEvents },
    { count: totalUsers },
    { count: pendingClaims },
    { count: activeRewards },
    { count: pendingLeads },
    { count: totalLeads },
    { count: analyzedLeads },
    { count: totalStories },
    { count: totalComments },
  ] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('challenges').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('events').select('*', { count: 'exact', head: true }).gt('starts_at', new Date().toISOString()),
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('rewards').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('nps_leads').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('nps_leads').select('*', { count: 'exact', head: true }),
    supabase.from('nps_leads').select('*', { count: 'exact', head: true }).not('ai_score', 'is', null),
    supabase.from('stories').select('*', { count: 'exact', head: true }),
    supabase.from('post_comments').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
  ]);

  const stats = [
    {
      title: 'Posts Pendentes',
      value: pendingPosts || 0,
      icon: '📝',
      href: '/admin/posts',
      color: 'border-l-yellow-500',
      description: 'Aguardando moderação',
    },
    {
      title: 'Stories',
      value: totalStories || 0,
      icon: '📱',
      href: '/admin/stories',
      color: 'border-l-pink-500',
      description: 'Stories dos criadores',
    },
    {
      title: 'Comentários',
      value: totalComments || 0,
      icon: '💬',
      href: '/admin/comentarios',
      color: 'border-l-blue-500',
      description: 'Comentários ativos',
    },
    {
      title: 'Engajamento',
      value: 0,
      icon: '📊',
      href: '/admin/engajamento',
      color: 'border-l-purple-500',
      description: 'Votos, shares, saves',
    },
    {
      title: 'Grafo Social',
      value: 0,
      icon: '👥',
      href: '/admin/seguidores',
      color: 'border-l-indigo-500',
      description: 'Seguidores e conexões',
    },
    {
      title: 'Desafios Ativos',
      value: activeChallenges || 0,
      icon: '🎯',
      href: '/admin/desafios',
      color: 'border-l-blue-500',
      description: `${pendingParticipations || 0} participações pendentes`,
    },
    {
      title: 'Eventos',
      value: activeEvents || 0,
      icon: '📅',
      href: '/admin/eventos',
      color: 'border-l-green-500',
      description: `${upcomingEvents || 0} próximos eventos`,
    },
    {
      title: 'Recompensas',
      value: activeRewards || 0,
      icon: '🎁',
      href: '/admin/premios',
      color: 'border-l-purple-500',
      description: `${pendingClaims || 0} resgates pendentes`,
    },
    {
      title: 'Usuários',
      value: totalUsers || 0,
      icon: '👥',
      href: '/admin/usuarios',
      color: 'border-l-pink-500',
      description: 'Total de usuários',
    },
    {
      title: 'Leads NPS',
      value: totalLeads || 0,
      icon: '📊',
      href: '/admin/leads',
      color: 'border-l-orange-500',
      description: `${pendingLeads || 0} pendentes · ${analyzedLeads || 0} analisados por AI`,
    },
    {
      title: 'Analytics',
      value: 0,
      icon: '📊',
      href: '/admin/analytics',
      color: 'border-l-cyan-500',
      description: 'Cohorts, retenção, métricas',
    },
    {
      title: 'Configurações',
      value: 12,
      icon: '⚙️',
      href: '/admin/configuracoes',
      color: 'border-l-gray-500',
      description: 'Nome, descrição, SEO',
    },
    {
      title: 'Templates de Email',
      value: 1,
      icon: '📧',
      href: '/admin/emails',
      color: 'border-l-indigo-500',
      description: 'Personalizar emails',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Ações Rápidas */}
      <Card className="p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          <Link
            href="/admin/desafios/novo"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">➕</span>
            <span className="text-xs sm:text-sm text-blue-700 font-medium text-center">Novo Desafio</span>
          </Link>
          <Link
            href="/admin/eventos/novo"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">📅</span>
            <span className="text-xs sm:text-sm text-green-700 font-medium text-center">Novo Evento</span>
          </Link>
          <Link
            href="/admin/posts"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">✅</span>
            <span className="text-xs sm:text-sm text-yellow-700 font-medium text-center">Moderar Posts</span>
          </Link>
          <Link
            href="/admin/stories"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">📱</span>
            <span className="text-xs sm:text-sm text-pink-700 font-medium text-center">Ver Stories</span>
          </Link>
          <Link
            href="/admin/comentarios"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">💬</span>
            <span className="text-xs sm:text-sm text-blue-700 font-medium text-center">Comentários</span>
          </Link>
          <Link
            href="/admin/premios"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">🎁</span>
            <span className="text-xs sm:text-sm text-purple-700 font-medium text-center">Gerenciar Prêmios</span>
          </Link>
          <Link
            href="/admin/leads"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-gradient-to-br from-orange-50 to-indigo-50 rounded-lg hover:from-orange-100 hover:to-indigo-100 transition-colors border border-indigo-100"
          >
            <span className="text-xl sm:text-2xl">🤖</span>
            <span className="text-xs sm:text-sm text-indigo-700 font-medium text-center">Leads + AI</span>
          </Link>
          <Link
            href="/admin/configuracoes"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">⚙️</span>
            <span className="text-xs sm:text-sm text-gray-700 font-medium text-center">Configurações</span>
          </Link>
          <Link
            href="/admin/emails"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">📧</span>
            <span className="text-xs sm:text-sm text-indigo-700 font-medium text-center">Emails</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 min-h-[80px] bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors"
          >
            <span className="text-xl sm:text-2xl">📊</span>
            <span className="text-xs sm:text-sm text-cyan-700 font-medium text-center">Analytics</span>
          </Link>
        </div>
      </Card>

      {/* Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Posts Recentes Pendentes */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Posts Pendentes</h2>
            <Link href="/admin/posts" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 min-h-[44px] flex items-center">
              Ver todos
            </Link>
          </div>
          <RecentPendingPosts />
        </Card>

        {/* Participações Recentes */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Participações Pendentes</h2>
            <Link href="/admin/desafios" className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 min-h-[44px] flex items-center">
              Ver todos
            </Link>
          </div>
          <RecentPendingParticipations />
        </Card>
      </div>
    </div>
  );
}

async function RecentPendingPosts() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      created_at,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhum post pendente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const profiles = post.profiles as { full_name: string; avatar_url: string } | { full_name: string; avatar_url: string }[] | null;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        return (
          <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm">
              {profile?.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
              <p className="text-sm text-gray-500 truncate">{post.content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function RecentPendingParticipations() {
  const supabase = await createClient();

  const { data: participations } = await supabase
    .from('challenge_participants')
    .select(`
      id,
      result_value,
      created_at,
      challenges:challenge_id (
        title,
        goal_type
      ),
      profiles:user_id (
        full_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!participations || participations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma participação pendente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {participations.map((p) => {
        const challenges = p.challenges as { title: string; goal_type: string } | { title: string; goal_type: string }[] | null;
        const challenge = Array.isArray(challenges) ? challenges[0] : challenges;
        const profiles = p.profiles as { full_name: string } | { full_name: string }[] | null;
        const profile = Array.isArray(profiles) ? profiles[0] : profiles;
        const unit = challenge?.goal_type === 'time' ? 's' : 'x';

        return (
          <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'Usuário'}</p>
              <p className="text-xs text-gray-500">{challenge?.title}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-indigo-600">
                {p.result_value}{unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
