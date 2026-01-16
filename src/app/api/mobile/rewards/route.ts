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

    // Parâmetros
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // digital, physical, money

    // Buscar prêmios ativos
    let query = supabaseAdmin
      .from('rewards')
      .select(`
        id,
        name,
        description,
        image_url,
        coins_required,
        quantity_available,
        type,
        is_active,
        available_options,
        created_at
      `)
      .eq('is_active', true)
      .order('coins_required', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Erro ao buscar prêmios:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar prêmios' },
        { status: 500 }
      );
    }

    // Buscar saldo do usuário
    const { data: coins } = await supabaseAdmin
      .from('user_coins')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const userBalance = coins?.balance || 0;

    // Formatar resposta com info de disponibilidade
    const formattedRewards = rewards?.map(reward => ({
      ...reward,
      can_claim: userBalance >= reward.coins_required &&
                 (reward.quantity_available === null || reward.quantity_available > 0),
      has_stock: reward.quantity_available === null || reward.quantity_available > 0,
    }));

    return NextResponse.json({
      rewards: formattedRewards,
      user_balance: userBalance,
    });
  } catch (err) {
    console.error('Erro nos prêmios:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
