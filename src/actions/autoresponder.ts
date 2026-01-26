'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { gerarRespostaIA, deveResponder, TipoResposta } from '@/lib/autoresponder';

// ID do usuário "Moço do Te Amo" (conta oficial)
const MOCO_USER_ID = process.env.MOCO_USER_ID || '';

// Delay: 3 minutos a 2 horas (em milissegundos)
const MIN_DELAY_MS = 3 * 60 * 1000;      // 3 minutos
const MAX_DELAY_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Gera um delay aleatório entre 3 minutos e 2 horas
 */
function gerarDelayAleatorio(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)) + MIN_DELAY_MS;
}

/**
 * Agenda uma resposta automática para um comentário
 * A resposta será enviada entre 3 minutos e 2 horas depois
 * Usa GPT-4o mini para gerar resposta contextualizada
 */
export async function agendarAutoResposta(
  postId: string,
  comentarioId: string,
  comentarioTexto: string,
  autorId: string,
  contextoPost?: string
): Promise<{ agendado: boolean; scheduledFor?: Date }> {
  // Não responder a si mesmo
  if (autorId === MOCO_USER_ID) {
    return { agendado: false };
  }

  // Não agendar se não tiver configurado o ID do Moço
  if (!MOCO_USER_ID) {
    console.warn('[AutoResponder] MOCO_USER_ID não configurado');
    return { agendado: false };
  }

  // 67% de chance de responder
  if (!deveResponder()) {
    return { agendado: false };
  }

  // Gerar resposta com IA (analisa o comentário e contexto do post)
  const resposta = await gerarRespostaIA(comentarioTexto, contextoPost);
  
  // Calcular quando responder (3min a 2h no futuro)
  const delayMs = gerarDelayAleatorio();
  const scheduledFor = new Date(Date.now() + delayMs);

  try {
    const supabase = createAdminClient();

    // Salvar na fila de respostas agendadas
    const { error } = await supabase
      .from('scheduled_autoresponses')
      .insert({
        post_id: postId,
        comment_id: comentarioId,
        response_text: resposta,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
      });

    if (error) {
      // Se tabela não existe, criar resposta direta (fallback)
      if (error.code === '42P01') {
        console.warn('[AutoResponder] Tabela scheduled_autoresponses não existe, respondendo diretamente');
        // Fallback: responder após 3 minutos mínimo
        setTimeout(() => {
          enviarRespostaAgendada(postId, comentarioId, resposta);
        }, MIN_DELAY_MS);
        return { agendado: true, scheduledFor: new Date(Date.now() + MIN_DELAY_MS) };
      }
      console.error('[AutoResponder] Erro ao agendar:', error);
      return { agendado: false };
    }

    const delayMinutos = Math.round(delayMs / 60000);
    console.log(`[AutoResponder] Resposta agendada para ${delayMinutos}min: "${resposta.substring(0, 50)}..."`);
    
    return { agendado: true, scheduledFor };
  } catch (err) {
    console.error('[AutoResponder] Erro:', err);
    return { agendado: false };
  }
}

/**
 * Agenda um comentário automático em um post
 * O comentário será enviado entre 3 minutos e 2 horas depois
 * Usa GPT-4o mini para gerar comentário contextualizado
 */
export async function agendarAutoComentarioPost(
  postId: string,
  postTexto: string,
  autorId: string
): Promise<{ agendado: boolean; scheduledFor?: Date }> {
  // Não comentar nos próprios posts
  if (autorId === MOCO_USER_ID) {
    return { agendado: false };
  }

  // Não agendar se não tiver configurado o ID do Moço
  if (!MOCO_USER_ID) {
    console.warn('[AutoResponder] MOCO_USER_ID não configurado');
    return { agendado: false };
  }

  // 67% de chance de comentar
  if (!deveResponder()) {
    return { agendado: false };
  }

  // Gerar comentário com IA (analisa o conteúdo do post)
  const comentario = await gerarRespostaIA(postTexto, undefined, 'post');
  
  // Calcular quando comentar (3min a 2h no futuro)
  const delayMs = gerarDelayAleatorio();
  const scheduledFor = new Date(Date.now() + delayMs);

  try {
    const supabase = createAdminClient();

    // Salvar na fila de respostas agendadas (reutilizando a mesma tabela)
    const { error } = await supabase
      .from('scheduled_autoresponses')
      .insert({
        post_id: postId,
        comment_id: null, // null indica que é comentário no post, não resposta a comentário
        response_text: comentario,
        scheduled_for: scheduledFor.toISOString(),
        status: 'pending',
        response_type: 'post_comment', // novo campo para diferenciar
      });

    if (error) {
      // Se tabela não existe ou campo não existe, tentar sem response_type
      if (error.code === '42P01' || error.code === '42703') {
        console.warn('[AutoResponder] Tabela/coluna não existe, respondendo diretamente');
        setTimeout(() => {
          enviarComentarioPost(postId, comentario);
        }, MIN_DELAY_MS);
        return { agendado: true, scheduledFor: new Date(Date.now() + MIN_DELAY_MS) };
      }
      console.error('[AutoResponder] Erro ao agendar comentário:', error);
      return { agendado: false };
    }

    const delayMinutos = Math.round(delayMs / 60000);
    console.log(`[AutoResponder] Comentário agendado para ${delayMinutos}min: "${comentario.substring(0, 50)}..."`);
    
    return { agendado: true, scheduledFor };
  } catch (err) {
    console.error('[AutoResponder] Erro:', err);
    return { agendado: false };
  }
}

/**
 * Envia um comentário em um post (não é resposta a outro comentário)
 */
export async function enviarComentarioPost(
  postId: string,
  comentario: string
): Promise<boolean> {
  if (!MOCO_USER_ID) return false;

  try {
    const supabase = createAdminClient();

    // Criar comentário no post (sem parent_id)
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: MOCO_USER_ID,
        content: comentario,
        parent_id: null, // Comentário direto no post
      });

    if (error) {
      console.error('[AutoResponder] Erro ao enviar comentário:', error);
      return false;
    }

    // Incrementar contador de comentários do post
    await supabase.rpc('increment_comments', { post_id: postId });

    console.log(`[AutoResponder] ✅ Comentou no post: "${comentario.substring(0, 50)}..."`);
    return true;
  } catch (err) {
    console.error('[AutoResponder] Erro ao enviar:', err);
    return false;
  }
}

/**
 * Envia uma resposta agendada
 */
export async function enviarRespostaAgendada(
  postId: string,
  comentarioId: string,
  resposta: string
): Promise<boolean> {
  if (!MOCO_USER_ID) return false;

  try {
    const supabase = createAdminClient();

    // Criar comentário como resposta
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: MOCO_USER_ID,
        content: resposta,
        parent_id: comentarioId,
      });

    if (error) {
      console.error('[AutoResponder] Erro ao enviar resposta:', error);
      return false;
    }

    // Incrementar contador de comentários do post
    await supabase.rpc('increment_comments', { post_id: postId });

    console.log(`[AutoResponder] ✅ Respondeu: "${resposta.substring(0, 50)}..."`);
    return true;
  } catch (err) {
    console.error('[AutoResponder] Erro ao enviar:', err);
    return false;
  }
}

/**
 * Processa respostas agendadas que estão prontas para enviar
 * Deve ser chamado pelo cron a cada minuto
 * Lida com ambos: comentários em posts e respostas a comentários
 */
export async function processarRespostasAgendadas(): Promise<{
  processadas: number;
  enviadas: number;
  comentariosPosts: number;
  respostasComentarios: number;
}> {
  if (!MOCO_USER_ID) {
    return { processadas: 0, enviadas: 0, comentariosPosts: 0, respostasComentarios: 0 };
  }

  const supabase = createAdminClient();

  // Buscar respostas pendentes que já passaram do horário agendado
  const { data: respostas, error } = await supabase
    .from('scheduled_autoresponses')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(20);

  if (error) {
    // Tabela pode não existir ainda
    if (error.code !== '42P01') {
      console.error('[AutoResponder] Erro ao buscar agendadas:', error);
    }
    return { processadas: 0, enviadas: 0, comentariosPosts: 0, respostasComentarios: 0 };
  }

  if (!respostas || respostas.length === 0) {
    return { processadas: 0, enviadas: 0, comentariosPosts: 0, respostasComentarios: 0 };
  }

  let enviadas = 0;
  let comentariosPosts = 0;
  let respostasComentarios = 0;

  for (const resp of respostas) {
    let sucesso = false;

    // Se comment_id é null, é comentário no post; senão é resposta a comentário
    if (resp.comment_id === null) {
      // Comentário direto no post
      sucesso = await enviarComentarioPost(resp.post_id, resp.response_text);
      if (sucesso) comentariosPosts++;
    } else {
      // Resposta a um comentário
      sucesso = await enviarRespostaAgendada(
        resp.post_id,
        resp.comment_id,
        resp.response_text
      );
      if (sucesso) respostasComentarios++;
    }

    // Atualizar status
    await supabase
      .from('scheduled_autoresponses')
      .update({
        status: sucesso ? 'sent' : 'failed',
        sent_at: sucesso ? new Date().toISOString() : null,
      })
      .eq('id', resp.id);

    if (sucesso) enviadas++;

    // Pequena pausa entre envios
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { processadas: respostas.length, enviadas, comentariosPosts, respostasComentarios };
}

// Manter função antiga para compatibilidade (agora agenda ao invés de responder direto)
export async function autoResponderComentario(
  postId: string,
  comentarioId: string,
  comentarioTexto: string,
  autorId: string,
  contextoPost?: string
): Promise<{ respondido: boolean; resposta?: string }> {
  const resultado = await agendarAutoResposta(postId, comentarioId, comentarioTexto, autorId, contextoPost);
  return { respondido: resultado.agendado };
}

/**
 * Comentar em posts pendentes (batch job)
 * Útil para processar posts que foram criados antes do autoresponder
 */
export async function processarPostsPendentes(limite: number = 50): Promise<{
  processados: number;
  comentados: number;
}> {
  if (!MOCO_USER_ID) {
    return { processados: 0, comentados: 0 };
  }

  const supabase = createAdminClient();

  // Buscar posts recentes de outros usuários
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      user_id,
      content,
      created_at
    `)
    .neq('user_id', MOCO_USER_ID)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error || !posts) {
    console.error('[AutoResponder] Erro ao buscar posts:', error);
    return { processados: 0, comentados: 0 };
  }

  let comentados = 0;

  for (const post of posts) {
    // Verificar se já existe comentário do Moço neste post
    const { data: comentarioExistente } = await supabase
      .from('post_comments')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', MOCO_USER_ID)
      .is('parent_id', null) // Apenas comentários diretos no post
      .single();

    if (comentarioExistente) {
      continue; // Já comentado
    }

    const resultado = await agendarAutoComentarioPost(
      post.id,
      post.content || '',
      post.user_id
    );

    if (resultado.agendado) {
      comentados++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { processados: posts.length, comentados };
}

/**
 * Responder comentários pendentes (batch job)
 * Útil para processar comentários que foram criados antes do autoresponder
 */
export async function processarComentariosPendentes(limite: number = 50): Promise<{
  processados: number;
  respondidos: number;
}> {
  if (!MOCO_USER_ID) {
    return { processados: 0, respondidos: 0 };
  }

  const supabase = createAdminClient();

  // Buscar comentários recentes que não têm resposta do Moço
  const { data: comentarios, error } = await supabase
    .from('post_comments')
    .select(`
      id,
      post_id,
      user_id,
      content,
      created_at
    `)
    .neq('user_id', MOCO_USER_ID)
    .is('parent_id', null) // Apenas comentários raiz
    .order('created_at', { ascending: false })
    .limit(limite);

  if (error || !comentarios) {
    console.error('[AutoResponder] Erro ao buscar comentários:', error);
    return { processados: 0, respondidos: 0 };
  }

  let respondidos = 0;

  for (const comentario of comentarios) {
    // Verificar se já existe resposta do Moço para este comentário
    const { data: respostaExistente } = await supabase
      .from('post_comments')
      .select('id')
      .eq('parent_id', comentario.id)
      .eq('user_id', MOCO_USER_ID)
      .single();

    if (respostaExistente) {
      continue; // Já respondido
    }

    const resultado = await autoResponderComentario(
      comentario.post_id,
      comentario.id,
      comentario.content,
      comentario.user_id
    );

    if (resultado.respondido) {
      respondidos++;
    }

    // Pequena pausa para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return { processados: comentarios.length, respondidos };
}
