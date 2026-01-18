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
    const { postId, value } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'ID do post é obrigatório' },
        { status: 400 }
      );
    }

    if (value !== 0 && value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: 'Valor do voto inválido. Use 1, -1 ou 0 para remover.' },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, vote_score')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    // Buscar voto existente
    const { data: existingVote } = await supabaseAdmin
      .from('post_votes')
      .select('id, value')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    const oldValue = existingVote?.value || 0;

    if (value === 0) {
      // Remover voto
      if (existingVote) {
        await supabaseAdmin
          .from('post_votes')
          .delete()
          .eq('id', existingVote.id);
      }
    } else if (existingVote) {
      // Atualizar voto existente
      await supabaseAdmin
        .from('post_votes')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', existingVote.id);
    } else {
      // Criar novo voto
      await supabaseAdmin
        .from('post_votes')
        .insert({
          user_id: user.id,
          post_id: postId,
          value,
        });
    }

    // Atualizar score do post
    const newScore = post.vote_score - oldValue + value;
    await supabaseAdmin
      .from('posts')
      .update({ vote_score: newScore })
      .eq('id', postId);

    return NextResponse.json({
      success: true,
      newScore,
      userVote: value === 0 ? null : value,
    });
  } catch (err) {
    console.error('Erro ao votar:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
