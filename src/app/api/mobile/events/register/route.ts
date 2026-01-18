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

// POST - Inscrever em evento
export async function POST(request: NextRequest) {
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, title, max_participants, is_active, starts_at, ends_at, is_online, online_url')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    if (!event.is_active) {
      return NextResponse.json(
        { error: 'Este evento não está mais ativo' },
        { status: 400 }
      );
    }

    // Verificar se já passou
    const now = new Date();
    const endTime = event.ends_at
      ? new Date(event.ends_at)
      : new Date(new Date(event.starts_at).getTime() + 2 * 60 * 60 * 1000);

    if (now > endTime) {
      return NextResponse.json(
        { error: 'Este evento já terminou' },
        { status: 400 }
      );
    }

    // Verificar se já está inscrito
    const { data: existingRegistration } = await supabaseAdmin
      .from('event_participants')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Você já está inscrito neste evento' },
        { status: 400 }
      );
    }

    // Verificar vagas
    if (event.max_participants) {
      const { count } = await supabaseAdmin
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if ((count || 0) >= event.max_participants) {
        return NextResponse.json(
          { error: 'Evento lotado. Não há mais vagas disponíveis.' },
          { status: 400 }
        );
      }
    }

    // Criar inscrição
    const { data: registration, error: regError } = await supabaseAdmin
      .from('event_participants')
      .insert({
        user_id: user.id,
        event_id: eventId,
        status: 'confirmed',
      })
      .select()
      .single();

    if (regError) {
      console.error('Erro ao criar inscrição:', regError);
      return NextResponse.json(
        { error: 'Erro ao processar inscrição' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inscrição realizada com sucesso!',
      registration: {
        id: registration.id,
        event_title: event.title,
        online_url: event.is_online ? event.online_url : null,
      },
    });
  } catch (err) {
    console.error('Erro na inscrição:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Cancelar inscrição
export async function DELETE(request: NextRequest) {
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'ID do evento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se está inscrito
    const { data: registration } = await supabaseAdmin
      .from('event_participants')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (!registration) {
      return NextResponse.json(
        { error: 'Você não está inscrito neste evento' },
        { status: 400 }
      );
    }

    // Verificar se o evento já começou
    const { data: event } = await supabaseAdmin
      .from('events')
      .select('starts_at')
      .eq('id', eventId)
      .single();

    if (event && new Date(event.starts_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Não é possível cancelar após o início do evento' },
        { status: 400 }
      );
    }

    // Cancelar inscrição
    const { error: deleteError } = await supabaseAdmin
      .from('event_participants')
      .delete()
      .eq('id', registration.id);

    if (deleteError) {
      console.error('Erro ao cancelar inscrição:', deleteError);
      return NextResponse.json(
        { error: 'Erro ao cancelar inscrição' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inscrição cancelada com sucesso',
    });
  } catch (err) {
    console.error('Erro ao cancelar inscrição:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
