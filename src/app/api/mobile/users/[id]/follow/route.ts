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

interface PageProps {
  params: Promise<{ id: string }>;
}

// Seguir usuário
export async function POST(request: NextRequest, { params }: PageProps) {
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

    const { id: userId } = await params;

    if (user.id === userId) {
      return NextResponse.json(
        { error: 'Você não pode seguir a si mesmo' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('user_follows')
      .insert({
        follower_id: user.id,
        following_id: userId,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Você já segue este usuário' },
          { status: 400 }
        );
      }
      console.error('Erro ao seguir usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao seguir usuário' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário seguido com sucesso',
    });
  } catch (err) {
    console.error('Erro ao seguir usuário:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Deixar de seguir usuário
export async function DELETE(request: NextRequest, { params }: PageProps) {
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

    const { id: userId } = await params;

    const { error } = await supabaseAdmin
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) {
      console.error('Erro ao deixar de seguir:', error);
      return NextResponse.json(
        { error: 'Erro ao deixar de seguir' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deixou de seguir com sucesso',
    });
  } catch (err) {
    console.error('Erro ao deixar de seguir:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
