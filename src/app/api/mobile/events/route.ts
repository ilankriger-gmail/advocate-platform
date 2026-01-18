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

// Verificar se evento está ao vivo
function isEventLive(startsAt: string, endsAt: string | null): boolean {
  const now = new Date();
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // Default 2h
  return now >= start && now <= end;
}

// Verificar se evento já passou
function isEventPast(endsAt: string | null, startsAt: string): boolean {
  const now = new Date();
  const end = endsAt ? new Date(endsAt) : new Date(new Date(startsAt).getTime() + 2 * 60 * 60 * 1000);
  return now > end;
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

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar eventos ativos (incluindo os que estão acontecendo agora)
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

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
        online_url,
        max_participants,
        is_active,
        created_at
      `)
      .eq('is_active', true)
      .or(`starts_at.gte.${now.toISOString()},and(starts_at.gte.${twoHoursAgo.toISOString()},starts_at.lte.${now.toISOString()})`)
      .order('starts_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      );
    }

    // Buscar inscrições do usuário
    const { data: userRegistrations } = await supabaseAdmin
      .from('event_participants')
      .select('event_id')
      .eq('user_id', user.id);

    const registeredEventIds = new Set(userRegistrations?.map(r => r.event_id) || []);

    // Buscar contagem de participantes e adicionar info
    const eventsWithInfo = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabaseAdmin
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        const isLive = isEventLive(event.starts_at, event.ends_at);
        const isPast = isEventPast(event.ends_at, event.starts_at);
        const isRegistered = registeredEventIds.has(event.id);
        const isFull = event.max_participants ? (count || 0) >= event.max_participants : false;

        return {
          ...event,
          participants_count: count || 0,
          is_live: isLive,
          is_past: isPast,
          is_registered: isRegistered,
          is_full: isFull,
          can_register: !isRegistered && !isFull && !isPast,
        };
      })
    );

    // Filtrar eventos que já passaram (a menos que estejam ao vivo)
    const activeEvents = eventsWithInfo.filter(e => !e.is_past || e.is_live);

    return NextResponse.json({
      events: activeEvents,
    });
  } catch (err) {
    console.error('Erro nos eventos:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
