import { createAdminClient } from '@/lib/supabase/server';
import { Card, Badge, Avatar } from '@/components/ui';
import { PaymentCenter } from './PaymentCenter';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Central de Pagamentos | Admin',
};

export default async function AdminPagamentosPage() {
  const supabase = createAdminClient();

  // Buscar todos os resgates com dados completos
  const { data: allClaims } = await supabase
    .from('reward_claims')
    .select(`
      *,
      rewards:reward_id (
        id,
        name,
        description,
        coins_required,
        type,
        image_url
      )
    `)
    .order('created_at', { ascending: true });

  // Buscar dados dos usuários
  const userIds = [...new Set(allClaims?.map(c => c.user_id) || [])];

  const [
    { data: users },
    { data: profiles },
    { data: userCoins },
  ] = await Promise.all([
    supabase.from('users').select('id, full_name, email, avatar_url, phone').in('id', userIds),
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds),
    supabase.from('user_coins').select('user_id, balance').in('user_id', userIds),
  ]);

  // Montar maps
  const usersMap: Record<string, { full_name?: string; email?: string; avatar_url?: string; phone?: string }> = {};
  users?.forEach(u => { usersMap[u.id] = u; });

  const profilesMap: Record<string, { full_name?: string; avatar_url?: string }> = {};
  profiles?.forEach(p => { profilesMap[p.id] = p; });

  const coinsMap: Record<string, number> = {};
  userCoins?.forEach(c => { coinsMap[c.user_id] = c.balance; });

  // Serializar dados para o client component
  const claimsData = (allClaims || []).map(claim => {
    const reward = claim.rewards as { id: string; name: string; description?: string; coins_required: number; type: string; image_url?: string } | null;
    const user = usersMap[claim.user_id];
    const profile = profilesMap[claim.user_id];
    const displayName = profile?.full_name || user?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const avatarUrl = profile?.avatar_url || user?.avatar_url;

    return {
      id: claim.id,
      userId: claim.user_id,
      status: claim.status as string,
      coinsSpent: claim.coins_spent,
      createdAt: claim.created_at,
      deliveryAddress: claim.delivery_address as Record<string, unknown> | null,
      notes: claim.notes as string | null,
      rewardName: reward?.name || 'Prêmio',
      rewardType: (reward?.type || 'digital') as string,
      rewardImageUrl: reward?.image_url || null,
      rewardCoinsRequired: reward?.coins_required || 0,
      userName: displayName,
      userEmail: user?.email || '',
      userPhone: user?.phone || '',
      userAvatarUrl: avatarUrl || null,
      userBalance: coinsMap[claim.user_id] ?? 0,
      receiptUrl: (claim.delivery_address as Record<string, unknown> | null)?.payment_receipt_url as string | null,
    };
  });

  return <PaymentCenter claims={claimsData} />;
}
