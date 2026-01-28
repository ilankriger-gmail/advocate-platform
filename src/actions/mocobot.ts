'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { gerarRespostaIA } from '@/lib/autoresponder';

/**
 * 🤖 Moço Bot - Interação automática na comunidade
 * 
 * O bot age como o Moço do Te Amo:
 * - Curte posts novos (80% probabilidade)
 * - Comenta posts interessantes (40% probabilidade)
 * - Responde comentários (67% probabilidade)
 * - Sempre com delays aleatórios pra parecer humano
 */

// ID do usuário "Moço do Te Amo" (conta oficial)
const MOCO_USER_ID = process.env.MOCO_USER_ID || '';

// === CONFIGURAÇÕES ===
const CONFIG = {
  // Probabilidades (0-1)
  PROB_CURTIR_POST: 0.80,      // 80% chance de curtir
  PROB_COMENTAR_POST: 0.40,    // 40% chance de comentar
  PROB_RESPONDER_COMMENT: 0.67, // 67% chance de responder
  
  // Delays (em milissegundos)
  DELAY_CURTIR_MIN: 5 * 60 * 1000,       // 5 minutos
  DELAY_CURTIR_MAX: 60 * 60 * 1000,      // 1 hora
  DELAY_COMENTAR_MIN: 10 * 60 * 1000,    // 10 minutos
  DELAY_COMENTAR_MAX: 2 * 60 * 60 * 1000, // 2 horas
  DELAY_RESPONDER_MIN: 3 * 60 * 1000,    // 3 minutos
  DELAY_RESPONDER_MAX: 2 * 60 * 60 * 1000, // 2 horas
};

/**
 * Gera delay aleatório
 */
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Verifica probabilidade
 */
function shouldAct(probability: number): boolean {
  return Math.random() < probability;
}

// === TIPOS ===
type ScheduledAction = {
  action_type: 'like' | 'comment' | 'reply';
  post_id: string;
  comment_id?: string;
  response_text?: string;
  scheduled_for: string;
  status: 'pending' | 'completed' | 'failed';
};

/**
 * 🔔 Chamado quando um novo POST é criado
 * Agenda curtida e possível comentário
 */
export async function onNewPost(
  postId: string,
  postContent: string,
  authorId: string
): Promise<{ liked: boolean; commented: boolean }> {
  // Não interagir com posts próprios
  if (authorId === MOCO_USER_ID || !MOCO_USER_ID) {
    return { liked: false, commented: false };
  }

  const supabase = createAdminClient();
  const result = { liked: false, commented: false };

  // Decidir se vai curtir (80%)
  if (shouldAct(CONFIG.PROB_CURTIR_POST)) {
    const scheduledFor = new Date(Date.now() + randomDelay(CONFIG.DELAY_CURTIR_MIN, CONFIG.DELAY_CURTIR_MAX));
    
    await supabase.from('scheduled_bot_actions').insert({
      action_type: 'like',
      post_id: postId,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    });
    
    result.liked = true;
  }

  // Decidir se vai comentar (40%)
  // Não comentar em posts muito curtos ou vazios
  if (postContent.trim().length >= 10 && shouldAct(CONFIG.PROB_COMENTAR_POST)) {
    const resposta = await gerarRespostaIA(postContent, undefined, 'post');
    const scheduledFor = new Date(Date.now() + randomDelay(CONFIG.DELAY_COMENTAR_MIN, CONFIG.DELAY_COMENTAR_MAX));
    
    await supabase.from('scheduled_bot_actions').insert({
      action_type: 'comment',
      post_id: postId,
      response_text: resposta,
      scheduled_for: scheduledFor.toISOString(),
      status: 'pending',
    });
    
    result.commented = true;
  }

  return result;
}

/**
 * 💬 Chamado quando um novo COMENTÁRIO é criado
 * Agenda possível resposta
 */
export async function onNewComment(
  postId: string,
  commentId: string,
  commentText: string,
  authorId: string,
  postContent?: string
): Promise<{ replied: boolean }> {
  // Não responder a si mesmo
  if (authorId === MOCO_USER_ID || !MOCO_USER_ID) {
    return { replied: false };
  }

  // Decidir se vai responder (67%)
  if (!shouldAct(CONFIG.PROB_RESPONDER_COMMENT)) {
    return { replied: false };
  }

  const supabase = createAdminClient();
  const resposta = await gerarRespostaIA(commentText, postContent, 'comentario');
  const scheduledFor = new Date(Date.now() + randomDelay(CONFIG.DELAY_RESPONDER_MIN, CONFIG.DELAY_RESPONDER_MAX));

  await supabase.from('scheduled_bot_actions').insert({
    action_type: 'reply',
    post_id: postId,
    comment_id: commentId,
    response_text: resposta,
    scheduled_for: scheduledFor.toISOString(),
    status: 'pending',
  });

  return { replied: true };
}

/**
 * ⏰ Processa ações agendadas (chamado pelo cron)
 */
export async function processScheduledActions(): Promise<{
  processed: number;
  likes: number;
  comments: number;
  replies: number;
  errors: number;
}> {
  if (!MOCO_USER_ID) {
    console.warn('[MocoBot] MOCO_USER_ID não configurado');
    return { processed: 0, likes: 0, comments: 0, replies: 0, errors: 0 };
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Buscar ações pendentes que já passaram do tempo
  const { data: actions, error } = await supabase
    .from('scheduled_bot_actions')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(20); // Processar em batches

  if (error) {
    console.error('[MocoBot] Erro ao buscar ações:', error);
    return { processed: 0, likes: 0, comments: 0, replies: 0, errors: 0 };
  }

  const result = { processed: 0, likes: 0, comments: 0, replies: 0, errors: 0 };

  for (const action of actions || []) {
    try {
      switch (action.action_type) {
        case 'like':
          await executeLike(supabase, action.post_id);
          result.likes++;
          break;
        case 'comment':
          await executeComment(supabase, action.post_id, action.response_text);
          result.comments++;
          break;
        case 'reply':
          await executeReply(supabase, action.post_id, action.comment_id, action.response_text);
          result.replies++;
          break;
      }

      // Marcar como completado
      await supabase
        .from('scheduled_bot_actions')
        .update({ status: 'completed', executed_at: new Date().toISOString() })
        .eq('id', action.id);
      
      result.processed++;
    } catch (err) {
      console.error(`[MocoBot] Erro ao processar ${action.action_type}:`, err);
      
      // Marcar como falha
      await supabase
        .from('scheduled_bot_actions')
        .update({ status: 'failed', error: String(err) })
        .eq('id', action.id);
      
      result.errors++;
    }
  }

  return result;
}

/**
 * Executa curtida
 */
async function executeLike(supabase: ReturnType<typeof createAdminClient>, postId: string) {
  // Verificar se já curtiu
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', MOCO_USER_ID)
    .single();

  if (existing) {
    console.log(`[MocoBot] Post ${postId} já curtido`);
    return;
  }

  await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: MOCO_USER_ID,
  });

  console.log(`[MocoBot] ❤️ Curtiu post ${postId}`);
}

/**
 * Executa comentário em post
 */
async function executeComment(
  supabase: ReturnType<typeof createAdminClient>,
  postId: string,
  text: string
) {
  await supabase.from('comments').insert({
    post_id: postId,
    user_id: MOCO_USER_ID,
    content: text,
  });

  console.log(`[MocoBot] 💬 Comentou no post ${postId}: "${text.substring(0, 50)}..."`);
}

/**
 * Executa resposta a comentário
 */
async function executeReply(
  supabase: ReturnType<typeof createAdminClient>,
  postId: string,
  commentId: string,
  text: string
) {
  await supabase.from('comments').insert({
    post_id: postId,
    user_id: MOCO_USER_ID,
    content: text,
    parent_id: commentId,
  });

  console.log(`[MocoBot] 💬 Respondeu comentário ${commentId}: "${text.substring(0, 50)}..."`);
}

/**
 * Status do bot
 */
export async function getMocoBotStatus(): Promise<{
  enabled: boolean;
  pending: number;
  completedToday: number;
  config: typeof CONFIG;
}> {
  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ count: pending }, { count: completedToday }] = await Promise.all([
    supabase
      .from('scheduled_bot_actions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('scheduled_bot_actions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('executed_at', today.toISOString()),
  ]);

  return {
    enabled: !!MOCO_USER_ID,
    pending: pending || 0,
    completedToday: completedToday || 0,
    config: CONFIG,
  };
}
