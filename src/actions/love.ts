'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LOVE_LEVELS, getLoveLevel, getStreakReward, getLikesGivenReward } from '@/lib/love-levels';
import { revalidatePath } from 'next/cache';

interface LoveActionResult {
  success: boolean;
  error?: string;
  level?: number;
  authorReward?: number;
  userCost?: number;
  streakDays?: number;
  streakReward?: number;
  likesGivenReward?: number;
  newBadge?: string;
}

/**
 * Dar amor com nível específico
 */
export async function giveLove(
  postId: string,
  levelId: number = 2 // Padrão: Te Amo (nível 2)
): Promise<LoveActionResult> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Verificar usuário
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Buscar nível
  const level = getLoveLevel(levelId);
  if (!level) {
    return { success: false, error: 'Nível inválido' };
  }

  // Buscar perfil do usuário (para verificar corações)
  const { data: profile } = await supabase
    .from('users')
    .select('coins, likes_given_count, last_like_date, like_streak')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { success: false, error: 'Perfil não encontrado' };
  }

  // Verificar se tem corações suficientes
  if (level.cost > 0 && (profile.coins || 0) < level.cost) {
    return { 
      success: false, 
      error: `Você precisa de ${level.cost} corações para dar "${level.name}"` 
    };
  }

  // Buscar post para pegar author_id
  const { data: post } = await supabase
    .from('posts')
    .select('user_id, likes_count')
    .eq('id', postId)
    .single();

  if (!post) {
    return { success: false, error: 'Post não encontrado' };
  }

  // Verificar se já deu like neste post
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id, level')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  // Se já existe like, atualizar nível (se for maior)
  if (existingLike) {
    if (levelId <= (existingLike.level || 2)) {
      return { success: false, error: 'Você já deu amor neste nível ou superior' };
    }

    // Upgrade de nível
    const oldLevel = getLoveLevel(existingLike.level || 2);
    const extraCost = level.cost - (oldLevel?.cost || 0);
    const extraReward = level.reward - (oldLevel?.reward || 0);

    if (extraCost > 0 && (profile.coins || 0) < extraCost) {
      return { success: false, error: `Você precisa de ${extraCost} corações para fazer upgrade` };
    }

    // Atualizar like existente
    await adminSupabase
      .from('post_likes')
      .update({ level: levelId, updated_at: new Date().toISOString() })
      .eq('id', existingLike.id);

    // Cobrar custo extra do usuário
    if (extraCost > 0) {
      await adminSupabase.rpc('add_user_coins', {
        p_user_id: user.id,
        p_amount: -extraCost,
        p_type: 'love_upgrade',
        p_description: `Upgrade para ${level.name}`
      });
    }

    // Dar recompensa extra ao autor
    if (extraReward > 0 && post.user_id !== user.id) {
      await adminSupabase.rpc('add_user_coins', {
        p_user_id: post.user_id,
        p_amount: extraReward,
        p_type: 'love_received',
        p_description: `Recebeu ${level.name} ${level.emoji}`
      });
    }

    revalidatePath(`/post/${postId}`);
    return { 
      success: true, 
      level: levelId,
      authorReward: extraReward,
      userCost: extraCost
    };
  }

  // Novo like
  const { error: likeError } = await adminSupabase
    .from('post_likes')
    .insert({
      post_id: postId,
      user_id: user.id,
      level: levelId,
    });

  if (likeError) {
    console.error('[Love] Erro ao criar like:', likeError);
    return { success: false, error: 'Erro ao dar amor' };
  }

  // Incrementar contador de likes do post
  await adminSupabase
    .from('posts')
    .update({ likes_count: (post.likes_count || 0) + 1 })
    .eq('id', postId);

  // Cobrar custo do usuário
  if (level.cost > 0) {
    await adminSupabase.rpc('add_user_coins', {
      p_user_id: user.id,
      p_amount: -level.cost,
      p_type: 'love_given',
      p_description: `Deu ${level.name} ${level.emoji}`
    });
  }

  // Dar recompensa ao autor (se não for o próprio usuário)
  if (level.reward > 0 && post.user_id !== user.id) {
    await adminSupabase.rpc('add_user_coins', {
      p_user_id: post.user_id,
      p_amount: level.reward,
      p_type: 'love_received',
      p_description: `Recebeu ${level.name} ${level.emoji}`
    });

    // Criar notificação para o autor
    await adminSupabase.from('notifications').insert({
      user_id: post.user_id,
      type: 'post_like',
      title: `${level.emoji} Novo amor!`,
      message: `Alguém te deu "${level.name}"!`,
      data: { postId, level: levelId },
    });
  }

  // Atualizar streak e contadores do usuário
  const today = new Date().toISOString().split('T')[0];
  const lastLikeDate = profile.last_like_date?.split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = profile.like_streak || 0;
  let streakReward = 0;
  let newBadge: string | undefined;

  if (lastLikeDate === yesterday) {
    // Continuou o streak
    newStreak += 1;
  } else if (lastLikeDate !== today) {
    // Quebrou o streak ou primeiro like
    newStreak = 1;
  }

  // Verificar recompensa de streak
  const streakRewardData = getStreakReward(newStreak);
  if (streakRewardData && newStreak === streakRewardData.days) {
    streakReward = streakRewardData.hearts;
    newBadge = streakRewardData.badge || undefined;

    await adminSupabase.rpc('add_user_coins', {
      p_user_id: user.id,
      p_amount: streakReward,
      p_type: 'streak_reward',
      p_description: `🔥 ${streakRewardData.message}`
    });
  }

  // Atualizar likes_given_count e streak
  const newLikesCount = (profile.likes_given_count || 0) + 1;
  await adminSupabase
    .from('users')
    .update({
      likes_given_count: newLikesCount,
      last_like_date: new Date().toISOString(),
      like_streak: newStreak,
    })
    .eq('id', user.id);

  // Verificar recompensa por likes dados
  let likesGivenReward = 0;
  const likesRewardData = getLikesGivenReward(newLikesCount);
  if (likesRewardData && newLikesCount === likesRewardData.likes) {
    likesGivenReward = likesRewardData.hearts;
    if (likesRewardData.badge) {
      newBadge = likesRewardData.badge;
    }

    await adminSupabase.rpc('add_user_coins', {
      p_user_id: user.id,
      p_amount: likesGivenReward,
      p_type: 'likes_given_reward',
      p_description: `🎁 Recompensa por espalhar amor!`
    });
  }

  revalidatePath(`/post/${postId}`);

  return {
    success: true,
    level: levelId,
    authorReward: level.reward,
    userCost: level.cost,
    streakDays: newStreak,
    streakReward,
    likesGivenReward,
    newBadge,
  };
}

/**
 * Remover amor (unlike)
 */
export async function removeLove(postId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Não autenticado' };
  }

  // Buscar like existente
  const { data: existingLike } = await supabase
    .from('post_likes')
    .select('id, level')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (!existingLike) {
    return { success: false, error: 'Você não deu amor neste post' };
  }

  // Remover like
  await adminSupabase
    .from('post_likes')
    .delete()
    .eq('id', existingLike.id);

  // Decrementar contador
  await adminSupabase.rpc('decrement_likes', { post_id: postId });

  revalidatePath(`/post/${postId}`);

  return { success: true };
}

/**
 * Buscar status de amor do usuário em um post
 */
export async function getLoveStatus(postId: string): Promise<{
  liked: boolean;
  level: number | null;
  totalLikes: number;
  levelCounts: Record<number, number>;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Buscar like do usuário
  let userLike = null;
  if (user) {
    const { data } = await supabase
      .from('post_likes')
      .select('level')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();
    userLike = data;
  }

  // Buscar contagem por nível
  const { data: likes } = await supabase
    .from('post_likes')
    .select('level')
    .eq('post_id', postId);

  const levelCounts: Record<number, number> = {};
  let totalLikes = 0;

  (likes || []).forEach(like => {
    const level = like.level || 2;
    levelCounts[level] = (levelCounts[level] || 0) + 1;
    totalLikes++;
  });

  return {
    liked: !!userLike,
    level: userLike?.level || null,
    totalLikes,
    levelCounts,
  };
}

/**
 * Buscar streak do usuário
 */
export async function getUserStreak(): Promise<{
  streak: number;
  lastLikeDate: string | null;
  nextReward: { days: number; hearts: number } | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { streak: 0, lastLikeDate: null, nextReward: null };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('like_streak, last_like_date')
    .eq('id', user.id)
    .single();

  const streak = profile?.like_streak || 0;
  const lastLikeDate = profile?.last_like_date || null;

  // Encontrar próxima recompensa
  const { STREAK_REWARDS } = await import('@/lib/love-levels');
  const nextReward = STREAK_REWARDS.find(r => r.days > streak) || null;

  return {
    streak,
    lastLikeDate,
    nextReward: nextReward ? { days: nextReward.days, hearts: nextReward.hearts } : null,
  };
}
