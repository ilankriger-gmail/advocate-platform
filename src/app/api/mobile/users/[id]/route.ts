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

export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const token = getTokenFromHeader(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    // Verificar token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        bio,
        is_creator,
        instagram_handle,
        tiktok_handle,
        youtube_handle,
        twitter_handle,
        followers_count,
        following_count,
        created_at
      `)
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário atual segue este perfil
    const { data: followData } = await supabaseAdmin
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    const isFollowing = !!followData;

    // Contar posts aprovados
    const { count: postsCount } = await supabaseAdmin
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');

    // Total de likes recebidos
    const { data: posts } = await supabaseAdmin
      .from('posts')
      .select('likes_count')
      .eq('user_id', userId)
      .eq('status', 'approved');

    const totalLikes = posts?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

    return NextResponse.json({
      profile: {
        ...profile,
        posts_count: postsCount || 0,
        total_likes: totalLikes,
      },
      isFollowing,
      isOwnProfile: user.id === userId,
    });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
