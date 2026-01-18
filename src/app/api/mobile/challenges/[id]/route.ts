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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Buscar desafio
    const { data: challenge, error } = await supabaseAdmin
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
      .eq('id', id)
      .single();

    if (error || !challenge) {
      return NextResponse.json(
        { error: 'Desafio não encontrado' },
        { status: 404 }
      );
    }

    // Buscar participação do usuário
    const { data: participation } = await supabaseAdmin
      .from('challenge_participants')
      .select('id, status, result_value, coins_earned, video_proof_url, created_at')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .maybeSingle();

    // Contar participantes
    const { count: participantsCount } = await supabaseAdmin
      .from('challenge_participants')
      .select('id', { count: 'exact', head: true })
      .eq('challenge_id', id);

    // Buscar ganhadores (se houver)
    const { data: winners } = await supabaseAdmin
      .from('challenge_winners')
      .select('id, instagram_username, prize_amount, pix_sent, created_at')
      .eq('challenge_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Buscar prêmios do desafio
    const { data: prizes } = await supabaseAdmin
      .from('challenge_prizes')
      .select('id, type, description, quantity')
      .eq('challenge_id', id);

    return NextResponse.json({
      challenge: {
        ...challenge,
        participants_count: participantsCount || 0,
        user_participation: participation || null,
        has_participated: !!participation,
        winners: winners || [],
        prizes: prizes || [],
      },
    });
  } catch (err) {
    console.error('Erro ao buscar desafio:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
