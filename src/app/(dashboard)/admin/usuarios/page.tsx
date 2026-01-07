import { createClient } from '@/lib/supabase/server';
import { Card, Badge } from '@/components/ui';
import { UserSearch, AddCoinsButton } from './UserAdminComponents';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q || '';
  const supabase = await createClient();

  // Buscar usuarios com saldo de coracoes
  let query = supabase
    .from('profiles')
    .select(`
      *,
      user_coins (
        balance
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,instagram_username.ilike.%${search}%`);
  }

  const { data: users } = await query;

  // Estatisticas gerais
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: totalCoinsData } = await supabase
    .from('user_coins')
    .select('balance');

  const totalCoins = (totalCoinsData || []).reduce((sum, u) => sum + (u.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">Visualize e gerencie os usuarios da plataforma</p>
        </div>
      </div>

      {/* Estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
          <p className="text-sm text-gray-500">Total de Usuarios</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">{totalCoins}</p>
          <p className="text-sm text-gray-500">Coracoes em Circulacao</p>
        </Card>
      </div>

      {/* Busca */}
      <UserSearch initialSearch={search} />

      {/* Lista de Usuarios */}
      {users && users.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {users.map((user) => {
            const coins = (user.user_coins as { balance: number }[])?.[0]?.balance || 0;

            return (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
                        {user.full_name?.[0] || '?'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{user.full_name || 'Sem nome'}</p>
                        {user.is_creator && (
                          <Badge className="bg-purple-100 text-purple-700">Creator</Badge>
                        )}
                        {user.role === 'admin' && (
                          <Badge className="bg-red-100 text-red-700">Admin</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        {user.email && <span>{user.email}</span>}
                        {user.instagram_username && (
                          <span className="text-pink-500">@{user.instagram_username}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-pink-500">{coins}</p>
                      <p className="text-xs text-gray-500">coracoes</p>
                    </div>

                    <AddCoinsButton userId={user.id} userName={user.full_name || 'Usuario'} />
                  </div>
                </div>

                {/* Detalhes extras */}
                <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-xs text-gray-500">
                  <span>
                    Membro desde: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  {user.phone && <span>Tel: {user.phone}</span>}
                  {user.advocate_level && (
                    <span>Nivel: {user.advocate_level}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {search ? 'Nenhum usuario encontrado' : 'Nenhum usuario'}
          </h2>
          <p className="text-gray-500">
            {search ? 'Tente uma busca diferente' : 'Ainda nao ha usuarios cadastrados'}
          </p>
        </Card>
      )}
    </div>
  );
}
