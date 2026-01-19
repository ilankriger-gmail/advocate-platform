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
    // Temporariamente sem autenticação obrigatória para testes
    const token = getTokenFromHeader(request);
    let userId: string | null = null;

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // Parâmetros
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active'; // active, closed, finished
    const type = searchParams.get('type'); // engajamento, fisico, atos_amor, participe

    // Buscar desafios
    let query = supabaseAdmin
      .from('challenges')
      .select(`
        id,
        title,
        description,
        type,
        icon,
        status,
        coins_reward,
        goal_type,
        goal_value,
        hashtag,
        profile_to_tag,
        starts_at,
        ends_at,
        image_url,
        thumbnail_url,
        prize_amount,
        num_winners,
        record_video_url,
        action_instructions,
        raffle_enabled,
        raffle_prize_amount,
        raffle_frequency_days,
        instagram_embed_url,
        created_at
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Erro ao buscar desafios:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar desafios' },
        { status: 500 }
      );
    }

    // Buscar participações do usuário (se autenticado)
    const challengeIds = challenges?.map(c => c.id) || [];
    let participationsMap = new Map();

    if (userId && challengeIds.length > 0) {
      const { data: participations } = await supabaseAdmin
        .from('challenge_participants')
        .select('challenge_id, status, result_value, coins_earned, created_at')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      participationsMap = new Map(
        participations?.map(p => [p.challenge_id, p]) || []
      );
    }

    // Contar participantes por desafio
    const { data: participantCounts } = await supabaseAdmin
      .from('challenge_participants')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    const countsMap = new Map<string, number>();
    participantCounts?.forEach(p => {
      countsMap.set(p.challenge_id, (countsMap.get(p.challenge_id) || 0) + 1);
    });

    // Formatar resposta
    const formattedChallenges = challenges?.map(challenge => ({
      ...challenge,
      participants_count: countsMap.get(challenge.id) || 0,
      user_participation: participationsMap.get(challenge.id) || null,
      has_participated: participationsMap.has(challenge.id),
    }));

    return NextResponse.json({
      challenges: formattedChallenges,
    });
  } catch (err) {
    console.error('Erro nos desafios:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
