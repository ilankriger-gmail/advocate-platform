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

    // Buscar posts do usuário
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select(`
        id,
        title,
        content,
        type,
        image_url,
        video_url,
        link_url,
        status,
        created_at,
        votes_count
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar posts:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar posts' },
        { status: 500 }
      );
    }

    // Buscar votos do usuário em seus próprios posts
    const postIds = posts?.map(p => p.id) || [];
    let userVotes: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: votes } = await supabaseAdmin
        .from('post_votes')
        .select('post_id, value')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      if (votes) {
        userVotes = votes.reduce((acc, vote) => {
          acc[vote.post_id] = vote.value;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    // Formatar posts
    const formattedPosts = posts?.map(post => ({
      ...post,
      user_vote: userVotes[post.id] || 0,
    }));

    return NextResponse.json({
      posts: formattedPosts,
    });
  } catch (err) {
    console.error('Erro ao buscar posts do usuário:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
