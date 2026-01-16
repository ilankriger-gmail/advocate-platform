import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para autenticação
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Fazer login via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos' },
        { status: 401 }
      );
    }

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role, is_creator')
      .eq('id', data.user.id)
      .single();

    // Buscar saldo de corações
    const { data: coins } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', data.user.id)
      .single();

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...profile,
        coins_balance: coins?.balance || 0,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
