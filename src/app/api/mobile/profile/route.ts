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

// GET - Buscar perfil do usuário
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar perfil completo
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Buscar saldo
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

    const { count: postsCount } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'approved');

    // Buscar histórico de participações recentes
    const { data: recentParticipations } = await supabaseAdmin
      .from('challenge_participants')
      .select(`
        id,
        status,
        result_value,
        coins_earned,
        created_at,
        challenge:challenges(
          id,
          title,
          icon,
          type,
          coins_reward
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      profile: {
        ...profile,
        email: user.email,
        coins_balance: coins?.balance || 0,
      },
      stats: {
        challenges_completed: challengesCompleted || 0,
        rewards_claimed: rewardsClaimed || 0,
        posts_count: postsCount || 0,
        coins_balance: coins?.balance || 0,
      },
      recent_participations: recentParticipations || [],
    });
  } catch (err) {
    console.error('Erro no perfil:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar perfil
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromHeader(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Campos permitidos para atualização
    const allowedFields = [
      'full_name',
      'bio',
      'instagram_handle',
      'tiktok_handle',
      'youtube_handle',
      'twitter_handle',
      'website_url',
    ];

    // Filtrar apenas campos permitidos
    const updateData: Record<string, string> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualizar' },
        { status: 400 }
      );
    }

    // Atualizar perfil
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: updatedProfile,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (err) {
    console.error('Erro ao atualizar perfil:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
