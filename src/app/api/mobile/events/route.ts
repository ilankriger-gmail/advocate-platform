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

    // Buscar eventos ativos
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        title,
        description,
        image_url,
        starts_at,
        ends_at,
        location,
        is_online,
        max_participants,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      );
    }

    // Buscar contagem de participantes para cada evento
    const eventsWithCount = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabaseAdmin
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          ...event,
          participants_count: count || 0,
        };
      })
    );

    return NextResponse.json(eventsWithCount);
  } catch (err) {
    console.error('Erro nos eventos:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
