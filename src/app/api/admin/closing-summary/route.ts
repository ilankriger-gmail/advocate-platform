import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/closing-summary
 * Returns a summary of everything that needs attention before closing the community
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, is_creator')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'creator' && !profile?.is_creator) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Fetch all data in parallel
    const [
      { count: totalUsers },
      { count: pendingClaims },
      { count: approvedClaims },
      { count: shippedClaims },
      { count: deliveredClaims },
      { count: rejectedClaims },
      { data: pendingClaimsData },
      { count: totalPosts },
      { count: pendingPosts },
      { data: coinsData },
      { count: newsletterSubs },
      { count: pendingParticipations },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'shipped'),
      supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('reward_claims').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('reward_claims')
        .select('id, status, reward:rewards(title, reward_type), user:users(display_name, email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(20),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('user_coins').select('balance'),
      supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
      supabase.from('challenge_participants').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // Calculate total coins
    const totalCoins = (coinsData || []).reduce((sum: number, c: { balance: number }) => sum + (c.balance || 0), 0);

    // Calculate PIX vs Physical claims
    let pixPending = 0;
    let physicalPending = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pendingClaimsData || []).forEach((claim: any) => {
      // Supabase returns joined relations as arrays
      const reward = Array.isArray(claim.reward) ? claim.reward[0] : claim.reward;
      const type = reward?.reward_type || '';
      if (type === 'pix') pixPending++;
      else physicalPending++;
    });

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        newsletterSubs: newsletterSubs || 0,
      },
      claims: {
        pending: pendingClaims || 0,
        approved: approvedClaims || 0,
        shipped: shippedClaims || 0,
        delivered: deliveredClaims || 0,
        rejected: rejectedClaims || 0,
        pixPending,
        physicalPending,
        pendingList: pendingClaimsData || [],
      },
      content: {
        totalPosts: totalPosts || 0,
        pendingPosts: pendingPosts || 0,
        pendingParticipations: pendingParticipations || 0,
      },
      economy: {
        totalCoins,
      },
      checklist: [
        {
          id: 'process-claims',
          label: 'Processar todos os resgates pendentes',
          done: (pendingClaims || 0) === 0,
          count: pendingClaims || 0,
          link: '/admin/resgates',
          priority: 'high',
        },
        {
          id: 'pay-pix',
          label: 'Pagar PIX dos resgates aprovados',
          done: (approvedClaims || 0) === 0 && pixPending === 0,
          count: (approvedClaims || 0) + pixPending,
          link: '/admin/pagamentos',
          priority: 'high',
        },
        {
          id: 'ship-physical',
          label: 'Enviar prêmios físicos',
          done: physicalPending === 0 && (shippedClaims || 0) === 0,
          count: physicalPending,
          link: '/admin/resgates',
          priority: 'medium',
        },
        {
          id: 'moderate-posts',
          label: 'Moderar posts pendentes',
          done: (pendingPosts || 0) === 0,
          count: pendingPosts || 0,
          link: '/admin/posts',
          priority: 'low',
        },
        {
          id: 'review-participations',
          label: 'Avaliar participações de desafios',
          done: (pendingParticipations || 0) === 0,
          count: pendingParticipations || 0,
          link: '/admin/desafios',
          priority: 'medium',
        },
        {
          id: 'send-broadcast',
          label: 'Enviar aviso de pausa por email',
          done: false, // Manual check
          count: 0,
          link: '/admin/broadcast',
          priority: 'high',
        },
        {
          id: 'enable-pause',
          label: 'Ativar modo de pausa',
          done: false, // Will be checked client-side
          count: 0,
          link: '/admin/pausa',
          priority: 'high',
        },
      ],
    });
  } catch (err) {
    console.error('Closing summary error:', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
