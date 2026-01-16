import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service role para bypassar RLS quando necessário
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper para extrair token do header Authorization
function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    // Verificar token e obter usuário
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar dados do perfil
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url, bio, role, is_creator, instagram_handle, tiktok_handle, youtube_handle, twitter_handle, website_url, created_at')
      .eq('id', user.id)
      .single();

    // Buscar saldo de corações
    const { data: coins } = await supabaseAdmin
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    // Buscar estatísticas
    const { count: challengesCompleted } = await supabaseAdmin
      .from('challenge_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved');

    const { count: rewardsClaimed } = await supabaseAdmin
      .from('reward_claims')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile,
        coins_balance: coins?.balance || 0,
        stats: {
          challenges_completed: challengesCompleted || 0,
          rewards_claimed: rewardsClaimed || 0,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
