import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // Verificar token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar participações do usuário com dados do desafio
    const { data: participations, error } = await supabaseAdmin
      .from('challenge_participants')
      .select(`
        id,
        status,
        result_value,
        coins_earned,
        video_proof_url,
        created_at,
        challenge:challenges (
          id,
          title,
          icon,
          goal_type,
          goal_value,
          coins_reward
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Erro ao buscar participações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar participações' },
        { status: 500 }
      );
    }

    // Buscar saldo de corações
    const { data: userCoins } = await supabaseAdmin
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      participations: participations || [],
      coins_balance: userCoins?.balance || 0,
    });
  } catch (err) {
    console.error('Erro nas participações:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
