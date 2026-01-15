'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  UserNotification,
  CreateNotificationInput,
  PaginatedNotificationsResponse,
} from '@/types/notification';

const PAGE_SIZE = 20;

/**
 * Buscar notificações do usuário com paginação
 */
export async function getNotifications(cursor?: string): Promise<PaginatedNotificationsResponse> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], nextCursor: null, hasMore: false, unreadCount: 0 };
  }

  let query = supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const [{ data: notifications, error }, { count: unreadCount }] = await Promise.all([
    query,
    supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ]);

  if (error) {
    console.error('Erro ao buscar notificações:', error);
    return { data: [], nextCursor: null, hasMore: false, unreadCount: 0 };
  }

  const hasMore = (notifications?.length || 0) > PAGE_SIZE;
  const data = hasMore ? notifications!.slice(0, PAGE_SIZE) : (notifications || []);
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].created_at : null;

  return {
    data: data as UserNotification[],
    nextCursor,
    hasMore,
    unreadCount: unreadCount || 0,
  };
}

/**
 * Contar notificações não lidas
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Erro ao contar notificações:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Marcar uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return { success: false, error: 'Erro ao atualizar notificação' };
  }

  revalidatePath('/');
  return { success: true, error: null };
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error);
    return { success: false, error: 'Erro ao atualizar notificações' };
  }

  revalidatePath('/');
  return { success: true, error: null };
}

/**
 * Deletar uma notificação
 */
export async function deleteNotification(notificationId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Erro ao deletar notificação:', error);
    return { success: false, error: 'Erro ao deletar notificação' };
  }

  revalidatePath('/');
  return { success: true, error: null };
}

/**
 * Deletar todas as notificações lidas
 */
export async function deleteReadNotifications(): Promise<{
  success: boolean;
  count: number;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, count: 0, error: 'Usuário não autenticado' };
  }

  const { data, error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true)
    .select('id');

  if (error) {
    console.error('Erro ao deletar notificações lidas:', error);
    return { success: false, count: 0, error: 'Erro ao deletar notificações' };
  }

  revalidatePath('/');
  return { success: true, count: data?.length || 0, error: null };
}

// ============ FUNÇÕES PARA CRIAR NOTIFICAÇÕES (uso interno) ============

/**
 * Criar uma notificação para um usuário
 * Uso interno - chamado por outras actions quando eventos acontecem
 */
export async function createNotification(input: CreateNotificationInput): Promise<{
  success: boolean;
  notificationId: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { error, data } = await supabase
    .from('user_notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message || null,
      link: input.link || null,
      icon: input.icon || null,
      metadata: input.metadata || {},
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar notificação:', error);
    return { success: false, notificationId: null, error: 'Erro ao criar notificação' };
  }

  return { success: true, notificationId: data.id, error: null };
}

/**
 * Criar notificação de novo seguidor
 */
export async function notifyNewFollower(
  followedUserId: string,
  followerName: string,
  followerAvatar?: string
): Promise<void> {
  await createNotification({
    user_id: followedUserId,
    type: 'new_follower',
    title: 'Novo seguidor',
    message: `${followerName} começou a te seguir`,
    link: '/perfil',
    icon: '👤',
    metadata: { follower_name: followerName, follower_avatar: followerAvatar },
  });
}

/**
 * Criar notificação de novo comentário
 */
export async function notifyNewComment(
  postOwnerId: string,
  commenterName: string,
  postId: string,
  commentPreview: string
): Promise<void> {
  // Não notifica se o autor do comentário for o dono do post
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === postOwnerId) return;

  const preview = commentPreview.length > 50
    ? commentPreview.substring(0, 50) + '...'
    : commentPreview;

  await createNotification({
    user_id: postOwnerId,
    type: 'new_comment',
    title: 'Novo comentário',
    message: `${commenterName}: "${preview}"`,
    link: `/post/${postId}`,
    icon: '💬',
    metadata: { post_id: postId, commenter_name: commenterName },
  });
}

/**
 * Criar notificação de novo like
 */
export async function notifyNewLike(
  postOwnerId: string,
  likerName: string,
  postId: string
): Promise<void> {
  // Não notifica se quem curtiu for o dono do post
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id === postOwnerId) return;

  await createNotification({
    user_id: postOwnerId,
    type: 'new_like',
    title: 'Novo like',
    message: `${likerName} curtiu seu post`,
    link: `/post/${postId}`,
    icon: '❤️',
    metadata: { post_id: postId, liker_name: likerName },
  });
}

/**
 * Criar notificação de post aprovado
 */
export async function notifyPostApproved(
  userId: string,
  postId: string,
  postTitle: string
): Promise<void> {
  const title = postTitle.length > 40
    ? postTitle.substring(0, 40) + '...'
    : postTitle;

  await createNotification({
    user_id: userId,
    type: 'post_approved',
    title: 'Post aprovado!',
    message: `Seu post "${title}" foi aprovado`,
    link: `/post/${postId}`,
    icon: '✅',
    metadata: { post_id: postId },
  });
}

/**
 * Criar notificação de post rejeitado
 */
export async function notifyPostRejected(
  userId: string,
  postTitle: string,
  reason?: string
): Promise<void> {
  const title = postTitle.length > 40
    ? postTitle.substring(0, 40) + '...'
    : postTitle;

  await createNotification({
    user_id: userId,
    type: 'post_rejected',
    title: 'Post não aprovado',
    message: reason || `Seu post "${title}" não foi aprovado`,
    link: '/perfil',
    icon: '❌',
    metadata: { reason },
  });
}

/**
 * Criar notificação de desafio aprovado
 */
export async function notifyChallengeApproved(
  userId: string,
  challengeTitle: string,
  coinsEarned: number
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'challenge_approved',
    title: 'Participação aprovada!',
    message: `Sua participação em "${challengeTitle}" foi aprovada. Você ganhou ${coinsEarned} corações!`,
    link: '/desafios',
    icon: '🏆',
    metadata: { challenge_title: challengeTitle, coins_earned: coinsEarned },
  });
}

/**
 * Criar notificação de desafio rejeitado
 */
export async function notifyChallengeRejected(
  userId: string,
  challengeTitle: string,
  reason?: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'challenge_rejected',
    title: 'Participação não aprovada',
    message: reason || `Sua participação em "${challengeTitle}" não foi aprovada`,
    link: '/desafios',
    icon: '😔',
    metadata: { challenge_title: challengeTitle, reason },
  });
}

/**
 * Criar notificação de ganhador de desafio
 */
export async function notifyChallengeWinner(
  userId: string,
  challengeTitle: string,
  prizeAmount: number
): Promise<void> {
  const formattedPrize = prizeAmount.toFixed(2);
  await createNotification({
    user_id: userId,
    type: 'challenge_winner',
    title: 'Parabéns! Você ganhou!',
    message: `Você foi selecionado como ganhador do desafio "${challengeTitle}"! Prêmio: R$ ${formattedPrize}`,
    link: '/desafios',
    icon: '🎉',
    metadata: { challenge_title: challengeTitle, prize_amount: prizeAmount },
  });
}

/**
 * Criar notificação de prêmio resgatado
 */
export async function notifyRewardClaimed(
  userId: string,
  rewardName: string,
  rewardId: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'reward_claimed',
    title: 'Prêmio resgatado!',
    message: `Você resgatou "${rewardName}". Em breve entraremos em contato!`,
    link: '/premios',
    icon: '🎁',
    metadata: { reward_name: rewardName, reward_id: rewardId },
  });
}

/**
 * Criar notificação de prêmio enviado
 */
export async function notifyRewardShipped(
  userId: string,
  rewardName: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'reward_shipped',
    title: 'Prêmio enviado!',
    message: `Seu prêmio "${rewardName}" foi enviado e está a caminho!`,
    link: '/premios',
    icon: '📦',
    metadata: { reward_name: rewardName },
  });
}

/**
 * Criar notificação de corações ganhos
 */
export async function notifyCoinsEarned(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  await createNotification({
    user_id: userId,
    type: 'coins_earned',
    title: `+${amount} corações!`,
    message: reason,
    link: '/desafios',
    icon: '💰',
    metadata: { amount, reason },
  });
}
