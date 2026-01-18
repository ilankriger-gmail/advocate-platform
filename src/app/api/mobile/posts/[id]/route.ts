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

    // Buscar post
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        title,
        content,
        media_url,
        media_type,
        youtube_url,
        instagram_url,
        type,
        status,
        likes_count,
        comments_count,
        vote_score,
        created_at,
        user_id
      `)
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    // Buscar autor
    const { data: author } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, is_creator')
      .eq('id', post.user_id)
      .single();

    // Buscar voto do usuário
    const { data: userVote } = await supabaseAdmin
      .from('post_votes')
      .select('value')
      .eq('user_id', user.id)
      .eq('post_id', id)
      .maybeSingle();

    return NextResponse.json({
      post: {
        ...post,
        author: author || { id: post.user_id, full_name: 'Usuário', avatar_url: null, is_creator: false },
        user_vote: userVote?.value || null,
      },
    });
  } catch (err) {
    console.error('Erro ao buscar post:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
