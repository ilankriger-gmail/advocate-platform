/**
 * Auto-responder do Moço do Te Amo
 * Usa GPT-4o mini para gerar respostas contextualizadas
 * Responde 67% dos comentários com ❤️‍🔥
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[AutoResponder] OPENAI_API_KEY não configurada');
    return null;
  }
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

const SYSTEM_PROMPT_COMENTARIO = `Você é o Moço do Te Amo, um criador de conteúdo brasileiro carismático, amoroso e motivador.
Você está respondendo comentários na sua comunidade "Arena Te Amo".

REGRAS:
1. Responda SEMPRE em português brasileiro informal e carinhoso
2. Use no MÁXIMO 2-3 frases curtas
3. SEMPRE inclua pelo menos um ❤️‍🔥 na resposta
4. Seja genuíno, empático e motivador
5. Se a pessoa fez uma pergunta, responda de forma útil mas breve
6. Se a pessoa está triste ou passando dificuldade, seja acolhedor
7. Se a pessoa fez um elogio, agradeça com carinho
8. Se a pessoa fez uma piada ou algo engraçado, ria junto (use kkkk)
9. NUNCA seja formal, robótico ou use linguagem corporativa
10. Finalize com algo como "Te amo!", "Tamo junto!", "❤️‍🔥" ou similar

EXEMPLOS DE RESPOSTAS:
- "Opa! Que comentário incrível ❤️‍🔥 Tamo junto sempre!"
- "Caramba, isso aí! ❤️‍🔥 Continue assim, te amo!"
- "Força! Você não tá sozinho ❤️‍🔥❤️‍🔥 Conte comigo!"
- "KKKK rachei! ❤️‍🔥 Você é demais!"`;

const SYSTEM_PROMPT_POST = `Você é o Moço do Te Amo, um criador de conteúdo brasileiro carismático, amoroso e motivador.
Você está comentando em POSTS da sua comunidade "Arena Te Amo".

REGRAS:
1. Comente SEMPRE em português brasileiro informal e carinhoso
2. Use no MÁXIMO 2-3 frases curtas
3. SEMPRE inclua pelo menos um ❤️‍🔥 no comentário
4. Seja genuíno, empático e motivador
5. Reaja ao conteúdo do post de forma personalizada
6. Se o post é uma pergunta, responda de forma útil
7. Se o post é desabafo/tristeza, seja acolhedor
8. Se o post é conquista/alegria, celebre junto
9. Se o post é engraçado, ria junto (use kkkk)
10. NUNCA seja formal, robótico ou genérico
11. Finalize com algo como "Te amo!", "Tamo junto!", "❤️‍🔥" ou similar

EXEMPLOS DE COMENTÁRIOS EM POSTS:
- "Que post incrível! ❤️‍🔥 Isso aí, bora pra cima!"
- "Caramba, amei isso! ❤️‍🔥 Continue compartilhando, te amo!"
- "Força! ❤️‍🔥 Tamo junto nessa jornada!"
- "KKKK muito bom! ❤️‍🔥 Você é demais!"
- "Que história linda! ❤️‍🔥❤️‍🔥 Obrigado por compartilhar!"`;

export type TipoResposta = 'comentario' | 'post';

/**
 * Gera uma resposta usando GPT-4o mini
 * @param texto - Texto do comentário ou post
 * @param contextoPost - Contexto adicional (para comentários)
 * @param tipo - 'comentario' para responder comentário, 'post' para comentar em post
 */
export async function gerarRespostaIA(
  texto: string,
  contextoPost?: string,
  tipo: TipoResposta = 'comentario'
): Promise<string> {
  const openai = getOpenAIClient();
  
  if (!openai) {
    // Fallback para resposta simples se OpenAI não configurada
    return tipo === 'post' ? gerarComentarioFallback(texto) : gerarRespostaFallback(texto);
  }

  try {
    const systemPrompt = tipo === 'post' ? SYSTEM_PROMPT_POST : SYSTEM_PROMPT_COMENTARIO;
    
    let userMessage: string;
    if (tipo === 'post') {
      userMessage = `Post para comentar: "${texto}"`;
    } else {
      userMessage = contextoPost 
        ? `Post: "${contextoPost}"\n\nComentário para responder: "${texto}"`
        : `Comentário para responder: "${texto}"`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.9, // Mais criativo
    });

    const resposta = response.choices[0]?.message?.content?.trim();
    
    if (!resposta) {
      return tipo === 'post' ? gerarComentarioFallback(texto) : gerarRespostaFallback(texto);
    }

    // Garantir que tem ❤️‍🔥 na resposta
    if (!resposta.includes('❤️‍🔥') && !resposta.includes('❤️')) {
      return resposta + ' ❤️‍🔥';
    }

    return resposta;
  } catch (error) {
    console.error('[AutoResponder] Erro ao gerar resposta com IA:', error);
    return tipo === 'post' ? gerarComentarioFallback(texto) : gerarRespostaFallback(texto);
  }
}

// Respostas de fallback caso a IA não funcione (para comentários)
const FALLBACK_RESPOSTAS = [
  'Opa! Amei isso ❤️‍🔥 Tamo junto!',
  'Que demais! ❤️‍🔥 Continue assim!',
  'Isso aí! ❤️‍🔥❤️‍🔥 Te amo!',
  'Show de bola! ❤️‍🔥 Valeu!',
  'Sensacional! ❤️‍🔥 Bora pra cima!',
  'Adorei! ❤️‍🔥 Tamo junto sempre!',
  'Você é demais! ❤️‍🔥',
  'Caramba! ❤️‍🔥 Muito bom!',
];

// Respostas de fallback para comentar em posts
const FALLBACK_COMENTARIOS_POST = [
  'Que post incrível! ❤️‍🔥 Tamo junto!',
  'Adorei o post! ❤️‍🔥 Continue compartilhando!',
  'Muito bom! ❤️‍🔥❤️‍🔥 Te amo!',
  'Show de bola esse post! ❤️‍🔥',
  'Sensacional! ❤️‍🔥 Bora pra cima!',
  'Amei! ❤️‍🔥 Obrigado por compartilhar!',
  'Você é demais! ❤️‍🔥 Post top!',
  'Caramba, que legal! ❤️‍🔥',
];

function gerarRespostaFallback(comentario: string): string {
  // Detectar contexto simples
  const lower = comentario.toLowerCase();
  
  if (lower.includes('?')) {
    return 'Boa pergunta! ❤️‍🔥 Vou pensar nisso!';
  }
  if (lower.includes('obrigad') || lower.includes('valeu')) {
    return 'Eu que agradeço! ❤️‍🔥 Te amo!';
  }
  if (lower.includes('triste') || lower.includes('difícil') || lower.includes('força')) {
    return 'Força! ❤️‍🔥 Tamo junto, você não tá sozinho!';
  }
  if (lower.includes('kk') || lower.includes('haha') || lower.includes('😂')) {
    return 'KKKK ❤️‍🔥 Adorei!';
  }
  
  return FALLBACK_RESPOSTAS[Math.floor(Math.random() * FALLBACK_RESPOSTAS.length)];
}

function gerarComentarioFallback(post: string): string {
  // Detectar contexto simples do post
  const lower = post.toLowerCase();
  
  if (lower.includes('?')) {
    return 'Boa pergunta! ❤️‍🔥 Adorei o post!';
  }
  if (lower.includes('consegui') || lower.includes('conquist') || lower.includes('passei')) {
    return 'Parabéns! ❤️‍🔥❤️‍🔥 Você é demais!';
  }
  if (lower.includes('triste') || lower.includes('difícil') || lower.includes('ajuda')) {
    return 'Força! ❤️‍🔥 Tamo junto nessa!';
  }
  if (lower.includes('kk') || lower.includes('haha') || lower.includes('😂')) {
    return 'KKKK ❤️‍🔥 Muito bom!';
  }
  if (lower.includes('obrigad') || lower.includes('agradeç')) {
    return 'Eu que agradeço! ❤️‍🔥 Te amo!';
  }
  
  return FALLBACK_COMENTARIOS_POST[Math.floor(Math.random() * FALLBACK_COMENTARIOS_POST.length)];
}

/**
 * Gera uma resposta (wrapper para compatibilidade)
 */
export function gerarResposta(comentario?: string): string {
  // Versão síncrona usa fallback
  return gerarRespostaFallback(comentario || '');
}

/**
 * Decide se deve responder (67% de chance)
 */
export function deveResponder(): boolean {
  return Math.random() < 0.67;
}

/**
 * Gera resposta se passar na probabilidade de 67%
 */
export function tentarGerarResposta(comentario?: string): string | null {
  if (!deveResponder()) return null;
  return gerarResposta(comentario);
}
