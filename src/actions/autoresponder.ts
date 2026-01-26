'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { tentarGerarResposta } from '@/lib/autoresponder';

// ID do usuário "Moço do Te Amo" (conta oficial)
const MOCO_USER_ID = process.env.MOCO_USER_ID || '';

/**
 * Tenta responder automaticamente um comentário como Moço do Te Amo
 * 67% de chance de responder
 */
export async function autoResponderComentario(
  postId: string,
  comentarioId: string,
  comentarioTexto: string,
  autorId: string
): Promise<{ respondido: boolean; resposta?: string }> {
  // Não responder a si mesmo
  if (autorId === MOCO_USER_ID) {
    return { respondido: false };
  }

  // Não responder se não tiver configurado o ID do Moço
  if (!MOCO_USER_ID) {
    console.warn('[AutoResponder] MOCO_USER_ID não configurado');
    return { respondido: false };
  }

  // Tentar gerar resposta (67% de chance)
  const resposta = tentarGerarResposta(comentarioTexto);
  
  if (!resposta) {
    return { respondido: false };
  }

  try {
    const supabase = createAdminClient();

    // Criar comentário como resposta
    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: MOCO_USER_ID,
        content: resposta,
        parent_id: comentarioId, // Resposta ao comentário original
      });

    if (error) {
      console.error('[AutoResponder] Erro ao criar resposta:', error);
      return { respondido: false };
    }

    // Incrementar contador de comentários do post
    await supabase.rpc('increment_comments', { post_id: postId });

    console.log(`[AutoResponder] Respondeu ao comentário ${comentarioId}: "${resposta}"`);
    
    return { respondido: true, resposta };
  } catch (err) {
    console.error('[AutoResponder] Erro:', err);
    return { respondido: false };
  }
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
