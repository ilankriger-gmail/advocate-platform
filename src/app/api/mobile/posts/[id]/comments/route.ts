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

// GET - Buscar comentários do post
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

    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Buscar comentários
    let query = supabaseAdmin
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: comments, error } = await query;

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar comentários' },
        { status: 500 }
      );
    }

    const hasMore = comments && comments.length > limit;
    const resultComments = hasMore ? comments.slice(0, -1) : comments || [];

    // Buscar autores
    const userIds = [...new Set(resultComments.map(c => c.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, is_creator')
      .in('id', userIds);

    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const formattedComments = resultComments.map(comment => ({
      ...comment,
      author: profilesMap.get(comment.user_id) || {
        id: comment.user_id,
        full_name: 'Usuário',
        avatar_url: null,
        is_creator: false,
      },
    }));

    return NextResponse.json({
      comments: formattedComments,
      nextCursor: hasMore ? resultComments[resultComments.length - 1]?.created_at : null,
      hasMore,
    });
  } catch (err) {
    console.error('Erro nos comentários:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar comentário
export async function POST(
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

    const { id: postId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comentário muito longo (máx. 1000 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar se o post existe
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, comments_count')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post não encontrado' },
        { status: 404 }
      );
    }

    // Criar comentário
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (commentError) {
      console.error('Erro ao criar comentário:', commentError);
      return NextResponse.json(
        { error: 'Erro ao criar comentário' },
        { status: 500 }
      );
    }

    // Atualizar contador de comentários
    await supabaseAdmin
      .from('posts')
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq('id', postId);

    // Buscar autor
    const { data: author } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, avatar_url, is_creator')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      comment: {
        ...comment,
        author: author || { id: user.id, full_name: 'Usuário', avatar_url: null, is_creator: false },
      },
    });
  } catch (err) {
    console.error('Erro ao criar comentário:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
