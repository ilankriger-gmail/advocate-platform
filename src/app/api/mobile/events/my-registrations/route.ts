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

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar inscrições do usuário
    const { data: registrations, error } = await supabaseAdmin
      .from('event_participants')
      .select(`
        id,
        status,
        created_at,
        event:events (
          id,
          title,
          description,
          image_url,
          starts_at,
          ends_at,
          location,
          is_online,
          online_url,
          is_active
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar inscrições:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar inscrições' },
        { status: 500 }
      );
    }

    // Adicionar status de tempo
    const now = new Date();
    const formattedRegistrations = registrations?.map(reg => {
      // event pode ser objeto ou array dependendo da relação
      const eventData = reg.event as unknown;
      const event = Array.isArray(eventData) ? eventData[0] : eventData as {
        id: string;
        title: string;
        starts_at: string;
        ends_at: string | null;
        is_online: boolean;
        online_url: string | null;
      } | null;

      if (!event) return null;

      const start = new Date(event.starts_at);
      const end = event.ends_at
        ? new Date(event.ends_at)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const isLive = now >= start && now <= end;
      const isPast = now > end;
      const isUpcoming = now < start;

      return {
        ...reg,
        event: {
          ...event,
          is_live: isLive,
          is_past: isPast,
          is_upcoming: isUpcoming,
        },
      };
    }).filter(Boolean);

    return NextResponse.json({
      registrations: formattedRegistrations,
    });
  } catch (err) {
    console.error('Erro nas inscrições:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
