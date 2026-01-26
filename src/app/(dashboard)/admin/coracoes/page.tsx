import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, Badge } from '@/components/ui';
import { HEARTS_CONFIG } from '@/lib/hearts-config';
import { Heart, Gift, Users, Calendar, MessageCircle, Share2, Bookmark, UserPlus, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE_POST: <MessageCircle className="w-4 h-4" />,
  LIKE_POST: <Heart className="w-4 h-4" />,
  COMMENT: <MessageCircle className="w-4 h-4" />,
  SHARE: <Share2 className="w-4 h-4" />,
  SAVE_POST: <Bookmark className="w-4 h-4" />,
  FOLLOW: <UserPlus className="w-4 h-4" />,
  BE_FOLLOWED: <Users className="w-4 h-4" />,
  REPLY_COMMENT: <MessageCircle className="w-4 h-4" />,
  MENTION: <Users className="w-4 h-4" />,
  COMPLETE_PROFILE: <Star className="w-4 h-4" />,
  ADD_AVATAR: <Star className="w-4 h-4" />,
  ADD_BIO: <Star className="w-4 h-4" />,
  VERIFY_EMAIL: <Star className="w-4 h-4" />,
  DAILY_LOGIN: <Calendar className="w-4 h-4" />,
  WATCH_LIVE: <Star className="w-4 h-4" />,
  VOTE_POLL: <Star className="w-4 h-4" />,
  REACT_STORY: <Heart className="w-4 h-4" />,
  INVITE_FRIEND: <Gift className="w-4 h-4" />,
  FRIEND_ACCEPTED: <Gift className="w-4 h-4" />,
  FIRST_POST: <Star className="w-4 h-4" />,
  STREAK_DAY: <Calendar className="w-4 h-4" />,
  JOIN_EVENT: <Calendar className="w-4 h-4" />,
  ATTEND_EVENT: <Calendar className="w-4 h-4" />,
  JOIN_CHALLENGE: <Gift className="w-4 h-4" />,
  COMPLETE_CHALLENGE: <Gift className="w-4 h-4" />,
  WIN_CHALLENGE: <Gift className="w-4 h-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_POST: 'Criar post',
  LIKE_POST: 'Curtir post',
  COMMENT: 'Comentar',
  SHARE: 'Compartilhar',
  SAVE_POST: 'Salvar post',
  FOLLOW: 'Seguir alguém',
  BE_FOLLOWED: 'Ganhar seguidor',
  REPLY_COMMENT: 'Responder comentário',
  MENTION: 'Mencionar alguém',
  COMPLETE_PROFILE: 'Completar perfil',
  ADD_AVATAR: 'Adicionar foto',
  ADD_BIO: 'Adicionar bio',
  VERIFY_EMAIL: 'Verificar email',
  DAILY_LOGIN: 'Login diário',
  WATCH_LIVE: 'Assistir live',
  VOTE_POLL: 'Votar em enquete',
  REACT_STORY: 'Reagir a story',
  INVITE_FRIEND: 'Convidar amigo',
  FRIEND_ACCEPTED: 'Amigo aceitar convite',
  FIRST_POST: 'Primeiro post',
  STREAK_DAY: 'Dia de streak',
  JOIN_EVENT: 'Inscrever em evento',
  ATTEND_EVENT: 'Participar de evento',
  JOIN_CHALLENGE: 'Entrar em desafio',
  COMPLETE_CHALLENGE: 'Completar desafio',
  WIN_CHALLENGE: 'Vencer desafio',
};

const CATEGORIES = {
  'Conteúdo': ['CREATE_POST', 'LIKE_POST', 'COMMENT', 'SHARE', 'SAVE_POST'],
  'Social': ['FOLLOW', 'BE_FOLLOWED', 'REPLY_COMMENT', 'MENTION'],
  'Perfil': ['COMPLETE_PROFILE', 'ADD_AVATAR', 'ADD_BIO', 'VERIFY_EMAIL'],
  'Engajamento': ['DAILY_LOGIN', 'WATCH_LIVE', 'VOTE_POLL', 'REACT_STORY'],
  'Crescimento': ['INVITE_FRIEND', 'FRIEND_ACCEPTED', 'FIRST_POST', 'STREAK_DAY'],
  'Eventos & Desafios': ['JOIN_EVENT', 'ATTEND_EVENT', 'JOIN_CHALLENGE', 'COMPLETE_CHALLENGE', 'WIN_CHALLENGE'],
};

export default async function AdminCoracoesPage() {
  const supabase = await createClient();

  // Verificar se é admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  // Buscar estatísticas de corações
  const { count: totalTransactions } = await supabase
    .from('coin_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'earned');

  const { data: totalCoins } = await supabase
    .from('coin_transactions')
    .select('amount')
    .eq('type', 'earned');

  const totalHeartsGiven = totalCoins?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Transações recentes
  const { data: recentTransactions } = await supabase
    .from('coin_transactions')
    .select(`
      id,
      amount,
      description,
      created_at,
      user:users!coin_transactions_user_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('type', 'earned')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">❤️ Sistema de Corações</h1>
        <p className="text-muted-foreground">
          Configure quantos corações cada ação dá na comunidade
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-500">{totalHeartsGiven}</div>
          <div className="text-sm text-muted-foreground">Corações dados</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{totalTransactions || 0}</div>
          <div className="text-sm text-muted-foreground">Transações</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{Object.keys(HEARTS_CONFIG).length}</div>
          <div className="text-sm text-muted-foreground">Ações configuradas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">1</div>
          <div className="text-sm text-muted-foreground">Coração por ação (flat)</div>
        </Card>
      </div>

      {/* Configuração por categoria */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORIES).map(([category, actions]) => (
          <Card key={category} className="p-4">
            <h3 className="font-semibold mb-3">{category}</h3>
            <div className="space-y-2">
              {actions.map((action) => (
                <div
                  key={action}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    {ACTION_ICONS[action] || <Heart className="w-4 h-4" />}
                    <span className="text-sm">{ACTION_LABELS[action] || action}</span>
                  </div>
                  <Badge variant="default" className="text-red-500">
                    ❤️ {HEARTS_CONFIG[action as keyof typeof HEARTS_CONFIG]}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Transações recentes */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Transações Recentes</h3>
        <div className="space-y-2">
          {recentTransactions?.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-xs">
                  {(t.user as { full_name?: string })?.full_name?.[0] || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {(t.user as { full_name?: string })?.full_name || 'Usuário'}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
              </div>
              <div className="text-red-500 font-medium">+{t.amount} ❤️</div>
            </div>
          ))}
          {(!recentTransactions || recentTransactions.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma transação ainda
            </p>
          )}
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
        <div className="flex gap-3">
          <Heart className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium">Como funciona</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Cada ação na comunidade dá <strong>1 coração</strong> para o usuário.
              Os corações são usados para ranking, níveis e recompensas.
              Para alterar os valores, edite o arquivo <code>src/lib/hearts.ts</code>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
