'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { tentarGerarResposta, gerarResposta, deveResponder } from '@/lib/autoresponder';

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
 */
export async function agendarAutoResposta(
  postId: string,
  comentarioId: string,
  comentarioTexto: string,
  autorId: string
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

  // Gerar resposta antecipadamente
  const resposta = gerarResposta(comentarioTexto);
  
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
 */
export async function processarRespostasAgendadas(): Promise<{
  processadas: number;
  enviadas: number;
}> {
  if (!MOCO_USER_ID) {
    return { processadas: 0, enviadas: 0 };
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
    return { processadas: 0, enviadas: 0 };
  }

  if (!respostas || respostas.length === 0) {
    return { processadas: 0, enviadas: 0 };
  }

  let enviadas = 0;

  for (const resp of respostas) {
    const sucesso = await enviarRespostaAgendada(
      resp.post_id,
      resp.comment_id,
      resp.response_text
    );

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

  return { processadas: respostas.length, enviadas };
}

// Manter função antiga para compatibilidade (agora agenda ao invés de responder direto)
export async function autoResponderComentario(
  postId: string,
  comentarioId: string,
  comentarioTexto: string,
  autorId: string
): Promise<{ respondido: boolean; resposta?: string }> {
  const resultado = await agendarAutoResposta(postId, comentarioId, comentarioTexto, autorId);
  return { respondido: resultado.agendado };
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
