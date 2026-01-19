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

// Validar URL do YouTube (não aceita Shorts)
function isValidYouTubeUrl(url: string): boolean {
  if (/youtube\.com\/shorts\//i.test(url)) {
    return false;
  }
  return /youtube\.com\/watch|youtu\.be\//.test(url);
}

// Validar URL do Instagram
function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|reels)\//.test(url);
}

export async function POST(request: NextRequest) {
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

    // Extrair dados do body
    const body = await request.json();
    const { challengeId, resultValue, videoProofUrl, instagramProofUrl } = body;

    if (!challengeId) {
      return NextResponse.json(
        { error: 'ID do desafio é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o desafio existe e está ativo
    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('is_active', true)
      .eq('status', 'active')
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: 'Desafio não encontrado ou encerrado' },
        { status: 404 }
      );
    }

    // Verificar tipo de desafio (fisico e atos_amor aceitam participação direta)
    if (challenge.type !== 'fisico' && challenge.type !== 'atos_amor') {
      return NextResponse.json(
        { error: 'Este desafio não aceita participações diretas' },
        { status: 400 }
      );
    }

    // Verificar se já participou
    const { data: existingParticipation } = await supabaseAdmin
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Você já participou deste desafio' },
        { status: 400 }
      );
    }

    // Validar URL do YouTube (obrigatório)
    if (!videoProofUrl) {
      return NextResponse.json(
        { error: 'Link do vídeo do YouTube é obrigatório' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(videoProofUrl)) {
      return NextResponse.json(
        { error: 'Apenas links do YouTube são aceitos. O vídeo deve ser público e não pode ser Shorts.' },
        { status: 400 }
      );
    }

    // Para Atos de Amor, Instagram é opcional mas se preenchido deve ser válido
    const isAtosAmor = challenge.type === 'atos_amor';
    if (instagramProofUrl && !isValidInstagramUrl(instagramProofUrl)) {
      return NextResponse.json(
        { error: 'Link do Instagram inválido. Use instagram.com/p/... ou instagram.com/reel/...' },
        { status: 400 }
      );
    }

    // Validar resultado para desafios físicos
    const finalResultValue = isAtosAmor ? 1 : (resultValue || 1);
    if (!isAtosAmor && (!resultValue || resultValue <= 0)) {
      return NextResponse.json(
        { error: 'Valor do resultado é obrigatório para desafios físicos' },
        { status: 400 }
      );
    }

    // Por enquanto, criar participação como pendente (sem análise de IA no mobile)
    // A análise de IA será feita posteriormente pelo admin ou em batch
    const { data: participation, error: insertError } = await supabaseAdmin
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        result_value: finalResultValue,
        video_proof_url: videoProofUrl,
        instagram_proof_url: instagramProofUrl || null,
        status: 'pending',
        coins_earned: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao criar participação:', insertError);
      return NextResponse.json(
        { error: 'Erro ao registrar participação' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      participation: {
        id: participation.id,
        status: participation.status,
        result_value: participation.result_value,
        created_at: participation.created_at,
      },
      message: 'Participação registrada com sucesso! Aguarde a análise.',
    });
  } catch (err) {
    console.error('Erro ao participar do desafio:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
