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
    // Temporariamente sem autenticação obrigatória para testes
    const token = getTokenFromHeader(request);
    let userId: string | null = null;

    if (token) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // Parâmetros de paginação e filtro
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const type = searchParams.get('type') || 'all'; // all, creator, community
    const sort = searchParams.get('sort') || 'new'; // new, top, hot

    // Query base
    let query = supabaseAdmin
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
        user_id,
        author:users!posts_user_id_fkey(
          id,
          full_name,
          avatar_url,
          is_creator
        )
      `)
      .eq('status', 'approved');

    // Filtro por tipo
    if (type === 'creator') {
      query = query.eq('type', 'creator');
    } else if (type === 'community') {
      query = query.eq('type', 'community');
    }

    // Ordenação
    if (sort === 'top') {
      query = query.order('vote_score', { ascending: false });
    } else if (sort === 'hot') {
      // Hot: combinação de votos e tempo (posts recentes com mais votos)
      query = query.order('vote_score', { ascending: false })
                   .order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Cursor para paginação
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    query = query.limit(limit);

    const { data: posts, error } = await query;

    if (error) {
      console.error('Erro ao buscar feed:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar feed' },
        { status: 500 }
      );
    }

    // Buscar votos do usuário para os posts retornados (se autenticado)
    const postIds = posts?.map(p => p.id) || [];
    let votesMap = new Map();

    if (userId && postIds.length > 0) {
      const { data: userVotes } = await supabaseAdmin
        .from('post_votes')
        .select('post_id, value')
        .eq('user_id', userId)
        .in('post_id', postIds);

      votesMap = new Map(userVotes?.map(v => [v.post_id, v.value]) || []);
    }

    // Formatar resposta
    const formattedPosts = posts?.map(post => ({
      ...post,
      user_vote: votesMap.get(post.id) || null,
    }));

    // Próximo cursor
    const nextCursor = posts && posts.length === limit
      ? posts[posts.length - 1].created_at
      : null;

    return NextResponse.json({
      posts: formattedPosts,
      nextCursor,
      hasMore: !!nextCursor,
    });
  } catch (err) {
    console.error('Erro no feed:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
